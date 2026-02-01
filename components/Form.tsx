
import React, { useState, useEffect } from 'react';
import { FormData, CourseOption } from '../types';
import { submitToGoogleSheets, fetchCoursesFromSheet } from '../services/googleSheetsService';

// Componente InputField actualizado para manejar mejor el estado visual disabled
const InputField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  icon, 
  required = true, 
  sublabel = "", 
  maxLength,
  autoFocus = false,
  disabled = false 
}: any) => (
  <div className={`flex flex-col gap-2 ${name === 'nombre' || name === 'whatsappTutor' ? 'md:col-span-2' : ''} transition-all duration-500 ${disabled ? 'pointer-events-none' : ''}`}>
    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] ml-1 transition-colors duration-300 ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
      {label} {sublabel && <span className={`italic text-[8px] transition-colors ${disabled ? 'text-gray-600' : 'text-[#ff0000]'}`}>({sublabel})</span>}
    </label>
    <div className="relative group">
      <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${disabled ? 'text-gray-700' : 'text-gray-500 group-focus-within:text-[#ff0000]'}`}>
        {icon}
      </span>
      <input
        required={required}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        onFocus={(e) => {
          if (type === 'tel' || type === 'text') {
            const target = e.target;
            const val = target.value;
            target.setSelectionRange(val.length, val.length);
            setTimeout(() => {
              target.setSelectionRange(val.length, val.length);
            }, 50);
          }
        }}
        className={`w-full pl-12 pr-4 h-14 rounded-xl border bg-[#0a0a0a] text-white placeholder:text-gray-700 text-base font-medium transition-all duration-500 outline-none shadow-inner 
          ${disabled 
            ? 'border-[#222] bg-[#0f0f0f] text-gray-500' 
            : 'border-[#333] focus:ring-1 focus:ring-[#ff0000] focus:border-[#ff0000]'
          }`}
        placeholder={placeholder}
      />
    </div>
  </div>
);

// Componente Select
const SelectField = ({ 
    label, 
    name, 
    value, 
    onChange, 
    icon, 
    options,
    isLoading,
    onRefresh
  }: any) => (
    <div className="flex flex-col gap-2 md:col-span-2">
      <div className="flex justify-between items-center ml-1">
        <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${!value ? 'text-[#ff0000] animate-pulse' : 'text-gray-400'}`}>
          {label} {!value && "(REQUERIDO)"}
        </label>
        <button 
          type="button" 
          onClick={onRefresh}
          className="text-[10px] text-gray-600 hover:text-[#ff0000] uppercase tracking-wider flex items-center gap-1 transition-colors"
          title="Forzar recarga"
        >
          <span className={`material-symbols-outlined text-[12px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
          {isLoading ? 'Conectando...' : 'Actualizar Lista'}
        </button>
      </div>
      <div className="relative group">
        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${!value ? 'text-[#ff0000]' : 'text-gray-500 group-focus-within:text-[#ff0000]'}`}>
          {isLoading ? 'sync' : icon}
        </span>
        <select
          name={name}
          value={value}
          onChange={onChange}
          required
          disabled={isLoading}
          className={`w-full pl-12 pr-4 h-14 rounded-xl border bg-[#0a0a0a] text-white text-base font-medium focus:ring-1 focus:ring-[#ff0000] focus:border-[#ff0000] transition-all outline-none shadow-inner appearance-none cursor-pointer disabled:opacity-50 ${!value ? 'border-[#ff0000] shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-[#333]'}`}
        >
          {isLoading ? (
             <option>Buscando cursos disponibles...</option>
          ) : (
            <>
              <option value="" className="bg-[#1a0d0d] text-gray-400">👇 -- SELECCIONA TU CURSO AQUÍ -- 👇</option>
              {options.length > 0 ? (
                options.map((opt: any) => (
                  <option key={opt.value} value={opt.value} className="bg-black text-white py-2">
                    {opt.label}
                  </option>
                ))
              ) : (
                <option value="">Error: No se encontraron hojas</option>
              )}
            </>
          )}
        </select>
        <span className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none ${isLoading ? 'animate-spin' : ''}`}>
          {isLoading ? 'refresh' : 'expand_more'}
        </span>
      </div>
      {/* MENSAJE DE DIAGNÓSTICO SI FALLA */}
      {!isLoading && options.length === 1 && options[0].label.includes('Error') && (
        <p className="text-[#ff0000] text-[10px] font-bold mt-1 text-center animate-pulse">
           ⚠ NO HAY CONEXIÓN CON LA PLANILLA. VERIFICA LA URL DEL SCRIPT.
        </p>
      )}
    </div>
  );

const Form: React.FC = () => {
  const initialFormState: FormData = {
    nombre: '',
    dni: '',
    edad: '',
    altura: '',
    medidas: '',
    instagram: '',
    whatsappPersonal: '3764',
    whatsappTutor: '3764',
    curso: ''
  };

  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // Determina si el usuario ya seleccionó un curso válido para habilitar el resto del formulario
  const isCourseSelected = formData.curso !== '' && !formData.curso.includes('Error');

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    setCourseOptions([]); 
    
    const courses = await fetchCoursesFromSheet();
    
    if (courses.length > 0) {
      const options = courses.map(c => ({ value: c, label: c }));
      setCourseOptions(options);
      // NO autoseleccionamos el curso. Dejamos que el usuario elija.
      // Si ya había uno seleccionado, verificamos que siga existiendo.
      if (formData.curso) {
         const stillExists = options.find(o => o.value === formData.curso);
         if (!stillExists) setFormData(prev => ({ ...prev, curso: '' }));
      }
    } else {
      const errorOption = { value: '', label: 'Error: Falló la conexión con Google' };
      setCourseOptions([errorOption]);
      setFormData(prev => ({ ...prev, curso: '' }));
    }
    setIsLoadingCourses(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);
const handleClose = () => {
    window.history.back();
  };
 {
    // Al cerrar, reseteamos el curso a vacío para obligar a elegir de nuevo en la próxima
    setFormData(initialFormState);
    setIsSuccess(false);
    setStatus(null);
    setIsSubmitting(false);
  };

  const getWhatsAppUrl = () => {
    const phone = "5493764354522";
    const rawText = `🔴 *NUEVA PRE-INSCRIPCIÓN*\n` +
                 `📚 *Curso:* ${formData.curso}\n\n` +
                 `👤 *Nombre:* ${formData.nombre}\n` +
                 `📄 *DNI:* ${formData.dni}\n` +
                 `🎂 *Edad:* ${formData.edad}\n` +
                 `📏 *Altura:* ${formData.altura}\n` +
                 `📐 *Medidas:* ${formData.medidas || 'N/A'}\n` +
                 `📸 *IG:* ${formData.instagram || 'N/A'}\n` +
                 `📱 *WP Alumno:* ${formData.whatsappPersonal}\n` +
                 `👨‍👩‍👧 *WP Tutor:* ${formData.whatsappTutor || 'No aplica'}`;
    
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(rawText)}`;
  };

  const handleEnterAction = () => {
    window.open(getWhatsAppUrl(), '_blank');
    setTimeout(() => {
        handleClose();
    }, 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess && e.key === 'Enter') {
        e.preventDefault();
        handleEnterAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuccess, formData]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nombre') {
      const capitalized = value.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
      setFormData(prev => ({ ...prev, [name]: capitalized }));
      return;
    }

    if (name === 'altura') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      let formattedHeight = numbersOnly;
      if (numbersOnly.length > 2) {
         formattedHeight = numbersOnly.substring(0, 1) + ',' + numbersOnly.substring(1, 3);
      } else if (numbersOnly.length > 1) {
         formattedHeight = numbersOnly.substring(0, 1) + ',' + numbersOnly.substring(1);
      }
      setFormData(prev => ({ ...prev, [name]: formattedHeight }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.curso || formData.curso.includes('Error')) {
        setStatus({ type: 'error', message: 'Seleccione un curso válido.' });
        return;
    }

    const age = parseInt(formData.edad);
    if (age < 18 && formData.whatsappTutor === '3764') {
       setStatus({ type: 'error', message: 'Para menores de 18 años, el WhatsApp del tutor es OBLIGATORIO.' });
       return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const result = await submitToGoogleSheets(formData as any);
    
    if (result.status === 'success') {
      setIsSubmitting(false);
      setIsSuccess(true); 
    } else {
      setStatus({ type: 'error', message: result.message });
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative z-10 w-full max-w-md bg-black rounded-3xl border border-[#333] overflow-hidden text-center p-8 md:p-12 animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
         <button onClick={handleClose} className="absolute top-4 right-4 size-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#333] rounded-full transition-all" title="Cerrar">
            <span className="material-symbols-outlined font-bold">close</span>
         </button>
         <div className="size-20 bg-[#ff0000] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#ff0000] animate-bounce">
            <span className="material-symbols-outlined text-black text-4xl font-black">check</span>
         </div>
         <h2 className="text-2xl font-black text-white uppercase italic mb-8 tracking-tighter">REGISTRO EXITOSO</h2>
         <div className="h-px w-full bg-[#222] mb-8"></div>
         <div className="flex flex-col gap-3 animate-pulse">
             <p className="text-white text-xs font-bold uppercase tracking-widest">👇 PARA FINALIZAR 👇</p>
             <p className="text-[#ff0000] text-sm font-bold uppercase tracking-widest mb-2">PRESIONA EL BOTÓN O "ENTER"</p>
         </div>
         <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" onClick={() => { setTimeout(() => { handleClose(); }, 3000); }} className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-black rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 group decoration-0 cursor-pointer">
           <span className="material-symbols-outlined text-xl">chat</span>
           <span>ENVIAR WHATSAPP</span>
         </a>
         <p className="text-gray-400 text-[10px] mt-4 uppercase">Esto abrirá la app de WhatsApp con los datos</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-2xl bg-black rounded-2xl shadow-2xl border border-[#222] overflow-hidden transition-all duration-500">
      <button onClick={handleClose} className="absolute top-4 right-4 md:top-6 md:right-6 size-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#222] rounded-full transition-all z-20" title="Cerrar / Limpiar">
        <span className="material-symbols-outlined text-2xl font-bold">close</span>
      </button>

      <div className="p-6 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="size-28 bg-black rounded-full border border-[#333] mb-4 shadow-xl flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-contain p-2" src="https://lh3.googleusercontent.com/d/1EFWhAi8I9zhStIst2GLh1E2A6RyJZODS" alt="Logo Formulario"/>
          </div>
          <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight text-center italic">
            Toma<span className="text-[#ff0000]">uno</span> Model's
          </h1>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-2">Registro de Alumnos</p>
          <div className="h-0.5 w-16 bg-[#ff0000] mt-3 mb-2"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SELECCIÓN DE CURSO - Único campo habilitado siempre */}
          <div className="grid grid-cols-1 gap-5 border-b border-[#222] pb-5">
            <SelectField
              label="Curso de Interés"
              name="curso"
              value={formData.curso}
              onChange={handleInputChange}
              icon="school"
              options={courseOptions}
              isLoading={isLoadingCourses}
              onRefresh={loadCourses}
            />
          </div>

          {/* MENSAJE DE ESPERA VISUAL (Solo aparece si no hay curso) */}
          {!isCourseSelected && !isLoadingCourses && (
             <div className="text-center py-4 bg-[#111] rounded-xl border border-dashed border-[#333] animate-pulse">
                <span className="text-[#ff0000] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined text-sm">lock</span>
                   Selecciona un curso para desbloquear el formulario
                </span>
             </div>
          )}

          {/* CAMPOS DEL FORMULARIO - Efecto "Glass" y Grayscale en lugar de oscuro total */}
          <div className={`space-y-5 transition-all duration-700 ease-in-out ${!isCourseSelected ? 'opacity-80 grayscale-[0.9] pointer-events-none select-none blur-[0.5px]' : 'opacity-100 grayscale-0 blur-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Martina Rossi" icon="person" disabled={!isCourseSelected} />
              <InputField label="DNI / Documento" name="dni" value={formData.dni} onChange={handleInputChange} placeholder="Sin puntos" icon="badge" disabled={!isCourseSelected} />
              <InputField label="Edad" name="edad" value={formData.edad} onChange={handleInputChange} placeholder="Años" type="number" icon="calendar_today" disabled={!isCourseSelected} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#222]">
              <InputField label="Altura (mts)" name="altura" value={formData.altura} onChange={handleInputChange} placeholder="Ej: 1,70" type="text" maxLength={4} icon="straighten" disabled={!isCourseSelected} />
              <InputField label="Medidas" name="medidas" value={formData.medidas} onChange={handleInputChange} placeholder="90-60-90" icon="architecture" disabled={!isCourseSelected} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#222]">
              <InputField label="Instagram" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@usuario" icon="alternate_email" disabled={!isCourseSelected} />
              <InputField label="WhatsApp Personal" name="whatsappPersonal" value={formData.whatsappPersonal} onChange={handleInputChange} placeholder="+54 9 ..." type="tel" icon="chat" disabled={!isCourseSelected} />
              <InputField label="WhatsApp Tutor" name="whatsappTutor" value={formData.whatsappTutor} onChange={handleInputChange} placeholder="Contacto Tutor" type="tel" icon="supervisor_account" required={formData.edad !== '' && parseInt(formData.edad) < 18} sublabel={formData.edad !== '' && parseInt(formData.edad) < 18 ? "OBLIGATORIO" : "Opción Menores"} disabled={!isCourseSelected} />
            </div>
          </div>

          {status && (
            <div className="p-3 rounded-lg text-sm font-bold flex items-center gap-2 bg-red-900/20 text-red-500 border border-red-900/50">
              <span className="material-symbols-outlined text-lg">error</span>
              {status.message}
            </div>
          )}

          <div className="pt-6">
            <button 
                disabled={isSubmitting || !isCourseSelected} 
                className="group relative w-full h-14 bg-[#ff0000] hover:bg-[#cc0000] text-white rounded-xl font-black text-lg uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed" 
                type="submit"
            >
              <span className="z-10 italic">
                {isSubmitting ? 'Guardando...' : (!isCourseSelected ? 'Formulario Bloqueado' : 'Enviar')}
              </span>
              {!isSubmitting && isCourseSelected && <span className="material-symbols-outlined z-10 font-bold">arrow_forward</span>}
              {!isSubmitting && !isCourseSelected && <span className="material-symbols-outlined z-10 font-bold">lock</span>}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;


