
import React from 'react';
import Form from './components/Form';

const App: React.FC = () => {
  return (
    // Contenedor centrado simple, sin header ni footer
    <div className="min-h-screen flex items-center justify-center p-4">
      <Form />
    </div>
  );
};

export default App;
