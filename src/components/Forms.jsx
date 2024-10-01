import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; // Importing Button from shadcn/ui
import PARQForm from './PARQForm';
import BodyCompositionForm from './BodyCompositionForm';

const Forms = () => {
  const [selectedForm, setSelectedForm] = useState(null); // State to track which form is selected

  const handleFormSelection = (formName) => {
    setSelectedForm(formName); // Set the selected form
  };

  return (
    <div className="p-5">
      {/* Header Section */}
      <div className="mb-3">

        <h4 className="text-lg  text-black ">Please choose a form to fill out:</h4>
      </div>

      {/* Form Selection Buttons */}
      <div className="mb-6 flex space-x-4">
        <Button
          variant={selectedForm === 'PARQ' ? "default" : "outline"} // Assuming "default" is filled, "outline" is unfilled
          onClick={() => handleFormSelection('PARQ')}
        >
          PAR-Q Form
        </Button>
        <Button
          variant={selectedForm === 'BodyComposition' ? "default" : "outline"}
          onClick={() => handleFormSelection('BodyComposition')}
        >
          Body Composition Analyzer
        </Button>
      </div>

      {/* Selected Form Display Area */}
      <div className="bg-white shadow-md rounded-md p-6 min-h-[400px]">
        {selectedForm === 'PARQ' && <PARQForm />}
        {selectedForm === 'BodyComposition' && <BodyCompositionForm />}
        {!selectedForm && (
          <p className="text-lg text-gray-600">Please select a form to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Forms;