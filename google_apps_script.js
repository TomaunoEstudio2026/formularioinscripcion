
/**
 * TOMAUNO MODELS - SISTEMA DE ESCANEO INTELIGENTE + NOTIFICACIONES
 * 1. Busca cursos activos.
 * 2. Inscribe alumno detectando huecos vacíos.
 * 3. Actualiza hoja 'Admin_Monitor' (Auto-creada) con Curso incluido.
 */

function doGet(e) {
  try {
    var doc = SpreadsheetApp.openById("1NOgVQFUaWQi1ls59EeBy9yBJ8Oo8MWvSwiwRMb7KNKI");
    var sheets = doc.getSheets();
    var courses = [];
    
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName(); 
      // Solo mostramos hojas que empiecen con "CURSO"
      if (name.trim().toUpperCase().indexOf("CURSO") === 0) {
        courses.push(name);
      }
    }

    if (courses.length === 0) {
      courses.push("No se encontraron cursos activos"); 
    }

    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "courses": courses
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "courses": ["Error de Script: " + error.toString()]
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.openById("1NOgVQFUaWQi1ls59EeBy9yBJ8Oo8MWvSwiwRMb7KNKI");
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date(); // Hora exacta del registro
    
    // --- 1. SELECCIÓN DE HOJA DEL CURSO ---
    var sheetName = data.curso; 
    var sheet = doc.getSheetByName(sheetName);

    // Búsqueda flexible (por si hay diferencias de mayúsculas)
    if (!sheet) {
       var sheets = doc.getSheets();
       for (var i = 0; i < sheets.length; i++) {
         if (sheets[i].getName().toUpperCase() === sheetName.toUpperCase()) {
            sheet = sheets[i];
            break;
         }
       }
    }

    // Fallback: Si no encuentra el curso específico, busca cualquiera que diga "CURSO"
    if (!sheet) {
        var sheets = doc.getSheets();
        for (var i = 0; i < sheets.length; i++) {
            if (sheets[i].getName().toUpperCase().indexOf("CURSO") === 0) {
                sheet = sheets[i];
                break;
            }
        }
    }

    if (!sheet) sheet = doc.getSheets()[0];
    
    // --- 2. DETECCIÓN DINÁMICA DE DONDE EMPEZAR A ESCRIBIR ---
    var startRow = 4;
    var headerCheck = sheet.getRange(1, 2, 15, 2).getValues(); 
    
    for (var h = 0; h < headerCheck.length; h++) {
        var colB = (headerCheck[h][0] || "").toString().toUpperCase();
        var colC = (headerCheck[h][1] || "").toString().toUpperCase();
        
        if (colB.includes("NOMBRE") || colC.includes("NOMBRE") || colB.includes("APELLIDO") || colC.includes("APELLIDO")) {
            startRow = h + 2; 
            break;
        }
    }

    // --- 3. ESCANEO DE HUECO VACÍO EN COLUMNA C (NOMBRE) ---
    var maxRowsToCheck = 300; 
    var rangeValues = sheet.getRange(startRow, 3, maxRowsToCheck, 1).getValues(); 
    var targetRow = -1;

    for (var i = 0; i < rangeValues.length; i++) {
        var cellContent = rangeValues[i][0];
        if (!cellContent || cellContent.toString().trim() === "") {
            targetRow = startRow + i;
            break;
        }
    }
    
    if (targetRow === -1) {
        targetRow = sheet.getLastRow() + 1;
    }
    
    // --- 4. GUARDAR DATOS DEL ALUMNO EN SU PLANILLA ---
    var rowData = [
      timestamp,                   // Col B: FECHA
      data.nombre,                 // Col C: NOMBRE
      "'" + data.dni,              // Col D: DNI
      data.edad,                   // Col E: EDAD
      data.altura,                 // Col F: ALTURA
      data.medidas,                // Col G: MEDIDAS
      "'" + data.whatsappPersonal, // Col H: WP
      "'" + data.whatsappTutor,    // Col I: WP TUTOR
      data.instagram               // Col J: INSTAGRAM
    ];

    sheet.getRange(targetRow, 2, 1, rowData.length).setValues([rowData]);
    
    // Poner número de orden
    try {
        var orderNumber = targetRow - (startRow - 1); 
        sheet.getRange(targetRow, 1).setValue(orderNumber);
    } catch(e) {}

    // --- 5. SISTEMA DE NOTIFICACIONES PARA TU WEB ADMIN ---
    // Esta parte CREA la hoja automáticamente y guarda los datos clave
    try {
        var monitorSheetName = "Admin_Monitor";
        var monitorSheet = doc.getSheetByName(monitorSheetName);
        
        // AUTO-CREACIÓN: Si no existe, la crea, la pinta de rojo y le pone títulos
        if (!monitorSheet) {
            monitorSheet = doc.insertSheet(monitorSheetName);
            monitorSheet.setTabColor("#FF0000"); // Rojo para que destaque
            
            // Títulos
            monitorSheet.getRange("A1").setValue("ULTIMO_REGISTRO_TIMESTAMP");
            monitorSheet.getRange("B1").setValue("NOMBRE_ALUMNO");
            monitorSheet.getRange("C1").setValue("NOMBRE_CURSO"); // <--- AQUÍ VA EL CURSO
        }

        // SIEMPRE sobrescribimos la fila 2. Tu sistema admin solo debe leer A2, B2 y C2.
        monitorSheet.getRange("A2").setValue(timestamp.getTime()); // Hora exacta (milisegundos)
        monitorSheet.getRange("B2").setValue(data.nombre);         // Nombre
        monitorSheet.getRange("C2").setValue(data.curso);          // Curso

    } catch(monitorError) {
        console.log("Error actualizando monitor: " + monitorError);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Inscripto en fila " + targetRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": "Error interno: " + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
