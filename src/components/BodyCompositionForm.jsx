import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const BodyCompositionForm = () => {
  const [formData, setFormData] = useState({
    bodyType: '',
    gender: 'Female',
    age: '',
    height: '',
    clothesWeight: '',
    weight: '',
    fatPercentage: '',
    fatMass: '',
    muscleMass: '',
    tbw: '',
    boneMass: '',
    bmr: '',
    metabolicAge: '',
    visceralFatRating: '',
    bmi: '',
    idealBodyWeight: '',
    degreeOfObesity: '',
    fatPercentageNew: '',
    fatMassNew: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const form = e.target.form;
      const inputs = Array.from(form.elements).filter(
        (el) =>
          ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) && !el.disabled
      );

      const index = inputs.indexOf(e.target);
      if (index > -1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    }
  };

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <div className="container mx-auto p-4">
      {/* Wrap your input fields in a form */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          {/* INPUT Section */}
          <h2 className="text-lg font-bold">INPUT</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="bodyType">Body Type</Label>
              <Input
                type="text"
                id="bodyType"
                name="bodyType"
                value={formData.bodyType}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Input
                type="text"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="clothesWeight">Clothes Weight (kg)</Label>
              <Input
                type="number"
                id="clothesWeight"
                name="clothesWeight"
                value={formData.clothesWeight}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* RESULT Section */}
          <h2 className="text-lg font-bold mt-6">RESULT</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="fatPercentage">Fat %</Label>
              <Input
                type="number"
                id="fatPercentage"
                name="fatPercentage"
                value={formData.fatPercentage}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="fatMass">Fat Mass (kg)</Label>
              <Input
                type="number"
                id="fatMass"
                name="fatMass"
                value={formData.fatMass}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="muscleMass">Muscle Mass (kg)</Label>
              <Input
                type="number"
                id="muscleMass"
                name="muscleMass"
                value={formData.muscleMass}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="tbw">TBW (%)</Label>
              <Input
                type="number"
                id="tbw"
                name="tbw"
                value={formData.tbw}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="boneMass">Bone Mass (kg)</Label>
              <Input
                type="number"
                id="boneMass"
                name="boneMass"
                value={formData.boneMass}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="bmr">BMR (kcal)</Label>
              <Input
                type="number"
                id="bmr"
                name="bmr"
                value={formData.bmr}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="metabolicAge">Metabolic Age</Label>
              <Input
                type="number"
                id="metabolicAge"
                name="metabolicAge"
                value={formData.metabolicAge}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="visceralFatRating">Visceral Fat Rating</Label>
              <Input
                type="number"
                id="visceralFatRating"
                name="visceralFatRating"
                value={formData.visceralFatRating}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="bmi">BMI</Label>
              <Input
                type="number"
                id="bmi"
                name="bmi"
                value={formData.bmi}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="idealBodyWeight">Ideal Body Weight (kg)</Label>
              <Input
                type="number"
                id="idealBodyWeight"
                name="idealBodyWeight"
                value={formData.idealBodyWeight}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="degreeOfObesity">Degree of Obesity (%)</Label>
              <Input
                type="number"
                id="degreeOfObesity"
                name="degreeOfObesity"
                value={formData.degreeOfObesity}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* DESIRABLE RANGE Section */}
          <h2 className="text-lg font-bold mt-6">DESIRABLE RANGE</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="fatPercentageNew">Fat %</Label>
              <Input
                type="number"
                id="fatPercentageNew"
                name="fatPercentageNew"
                value={formData.fatPercentageNew}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="fatMassNew">Fat Mass (kg)</Label>
              <Input
                type="number"
                id="fatMassNew"
                name="fatMassNew"
                value={formData.fatMassNew}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <div className="flex mt-6 justify-end mb-4">
          <Button onClick={handlePrint}>Print Receipt</Button>
          </div>
        </div>
      </form>

      <div ref={printRef} className="print-area">
      <div className="receipt-wrapper">
      <div className="receipt-container">
        <h2 className="brand">Her Chamber Fitness</h2>
        <p className="receipt-title">BODY COMPOSITION ANALYZER</p>
        <p className="date">{new Date().toLocaleDateString()}</p>

        <div className="section">
          <p className="section-title">INPUT</p>
          <p>Body Type: <span>{formData.bodyType}</span></p>
          <p>Gender: <span>{formData.gender}</span></p>
          <p>Age: <span>{formData.age}</span></p>
          <p>Height: <span>{formData.height} cm</span></p>
          <p>Clothes Weight: <span>{formData.clothesWeight} kg</span></p>
        </div>

        <div className="section">
          <p className="section-title">RESULT</p>
          <p>Weight: <span>{formData.weight} kg</span></p>
          <p>Fat %: <span>{formData.fatPercentage}%</span></p>
          <p>Fat Mass: <span>{formData.fatMass} kg</span></p>
          <p>Muscle Mass: <span>{formData.muscleMass} kg</span></p>
          <p>TBW: <span>{formData.tbw}%</span></p>
          <p>Bone Mass: <span>{formData.boneMass} kg</span></p>
          <p>BMR: <span>{formData.bmr} kcal</span></p>
          <p>Metabolic Age: <span>{formData.metabolicAge}</span></p>
          <p>Visceral Fat Rating: <span>{formData.visceralFatRating}</span></p>
          <p>BMI: <span>{formData.bmi}</span></p>
          <p>Ideal Body Weight: <span>{formData.idealBodyWeight} kg</span></p>
          <p>Degree of Obesity: <span>{formData.degreeOfObesity}%</span></p>
        </div>

        <div className="section desirable-range">
          <p className="section-title">DESIRABLE RANGE</p>
          <p>Fat %: <span>{formData.fatPercentageNew}%</span></p>
          <p>Fat Mass: <span>{formData.fatMassNew} kg</span></p>
        </div>
      </div>
      </div>
      </div>

      <style jsx>{`
        @media print {
          .print-area {
            display: block !important;
          }
        }
        .print-area {
          display: none;
        }
        .receipt-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }
        .receipt-container {
          font-family: 'Courier New', monospace;
          width: 300px;
          margin: 0 auto;
          padding: 20px 10px;
          background-color: #fff;
          border: 1px dashed #000;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          
        }
        .brand {
          text-align: center;
          font-weight: bold;
          font-size: 20px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .receipt-title {
          text-align: center;
          font-size: 14px;
          margin-bottom: 5px;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
        }
        .date {
          text-align: center;
          font-size: 12px;
          margin-bottom: 15px;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
          text-decoration: underline;
        }
        .section p {
          margin: 0;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
        .desirable-range {
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default BodyCompositionForm;
