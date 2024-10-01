import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FaCheck } from 'react-icons/fa';
import logo from '../assets/log.png';

const PARQForm = () => {
  // Initialize form data with relevant fields
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    date: '',
    height: '',
    weight: '',
    age: '',
    physiciansName: '',
    phone: '',
    // Occupational Questions
    occupation: '',
    requiresSitting: '',
    requiresRepetitive: '',
    wearsHeels: '',
    causesAnxiety: '',
    // Recreational Questions
    recreationalActivities: '',
    hobbies: '',
    // Medical Questions
    painOrInjuries: '',
    surgeries: '',
    chronicDiseases: '',
    medications: '',
  });

  // Separate answers for PAR-Q and General & Medical sections
  const [parqAnswers, setParqAnswers] = useState(Array(7).fill('no')); // 7 PAR-Q questions
  const [generalAnswers, setGeneralAnswers] = useState(Array(10).fill('no')); // 10 General & Medical questions excluding occupation

  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { 
        size: auto; 
        margin: 15mm 10mm; 
      }
      body {
        font-family: 'Arial', sans-serif;
      }
      .print-button {
        display: none;
      }
    `,
  });

  // Handle input changes for all form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle answer clicks for PAR-Q section
  const handleParqAnswerClick = (index, answer) => {
    const updatedAnswers = [...parqAnswers];
    updatedAnswers[index] = answer;
    setParqAnswers(updatedAnswers);
    // No need to clear any fields as PAR-Q doesn't have explanation fields
  };

  // Handle answer clicks for General & Medical section
  const handleGeneralAnswerClick = (index, answer) => {
    const updatedAnswers = [...generalAnswers];
    updatedAnswers[index] = answer;
    setGeneralAnswers(updatedAnswers);
    
    // Clear the corresponding field if 'No' is selected
    if (answer === 'no') {
      // Map index to the corresponding field in formData
      const fieldMap = {
        0: 'requiresSitting',
        1: 'requiresRepetitive',
        2: 'wearsHeels',
        3: 'causesAnxiety',
        4: 'recreationalActivities',
        5: 'hobbies',
        6: 'painOrInjuries',
        7: 'surgeries',
        8: 'chronicDiseases',
        9: 'medications',
      };
      const fieldName = fieldMap[index];
      if (fieldName) {
        setFormData(prev => ({ ...prev, [fieldName]: '' }));
      }
    }
  };
    const renderYesNoQuestion = (index, question, fieldName, requiresExplanation, section) => {
      // Determine which answers state to use based on the section
      const currentAnswers = section === 'parq' ? parqAnswers : generalAnswers;
      const handleClick = section === 'parq' ? handleParqAnswerClick : handleGeneralAnswerClick;
      const currentAnswer = currentAnswers[index];
  
      return (
        <tr key={`${section}-${index}`} className="border-t border-gray-300">
          <td className="text-center py-2 px-4 border-r border-gray-300">{index + 1}</td>
          <td className="py-2 px-2 pr-4 border-l" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
            <p>{question}</p>
            {requiresExplanation && currentAnswer === 'yes' && (
              <textarea
                name={fieldName}
                value={formData[fieldName]}
                onChange={handleInputChange}
                className="mt-2 block w-full border-b border-gray-300"
                placeholder="Please explain"
                style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', resize: 'none' }}
                rows={2}
              />
            )}
          </td>
          <td className="text-center border-l border-gray-300 w-16">
            <div
              className={`w-6 h-6 mx-auto cursor-pointer ${currentAnswer === 'yes' ? 'text-green-500' : ''}`}
              onClick={() => handleClick(index, 'yes')}
            >
              {currentAnswer === 'yes' ? <FaCheck /> : null}
            </div>
          </td>
          <td className="text-center border-l border-gray-300 w-16">
            <div
              className={`w-6 h-6 mx-auto cursor-pointer ${currentAnswer === 'no' ? 'text-red-500' : ''}`}
              onClick={() => handleClick(index, 'no')}
            >
              {currentAnswer === 'no' ? <FaCheck /> : null}
            </div>
          </td>
        </tr>
      );
    };
  

    const renderInputQuestion = (question, fieldName) => (
      <tr key={`input-${fieldName}`} className="border-t border-gray-300">
        <td className="text-center py-2 px-4 border-r border-gray-300"></td> {/* Empty cell for numbering */}
        <td className="py-2 px-2 pr-4 border-l" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
          <p>{question}</p>
          <input
            type="text"
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleInputChange}
            className="mt-2 block w-full border-b border-gray-300"
            placeholder="Please specify"
          />
        </td>
        <td className="text-center border-l border-gray-300 w-16"></td> {/* Empty cell for Yes */}
        <td className="text-center border-l border-gray-300 w-16"></td> {/* Empty cell for No */}
      </tr>
    );
  
    return (
      <div className="max-w-4xl mx-auto p-4 form-container">
        <div ref={componentRef} className="bg-white p-4 border border-gray-300">
          {/* Logo Section */}
          <div className="flex justify-end mb-4 h-40">
            <img src={logo} alt="Her Chamber Fitness logo" />
          </div>
 
  {/* Personal Information Fields */}
          <div className="max-w-xl mx-auto mb-10">
            {/* Name and Date */}
            <div className="mb-4">
              <div className="flex justify-between">
                <div className="flex-grow mr-4">
                  <label className="text-sm font-medium text-gray-700">NAME:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-b border-gray-300 font-bold"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium text-gray-700">DATE:</label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-b border-gray-300 font-bold"
                  />
                </div>
              </div>
            </div>
  
            {/* Height, Weight, Age */}
            <div className="flex justify-between mb-4">
              <div className="w-1/4">
                <label className="text-sm font-medium text-gray-700">HEIGHT:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-b border-gray-300 font-bold"
                  />
                  <span className="ml-1">in.</span>
                </div>
              </div>
              <div className="w-1/4">
                <label className="text-sm font-medium text-gray-700">WEIGHT:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-b border-gray-300 font-bold"
                  />
                  <span className="ml-1">lbs.</span>
                </div>
              </div>
              <div className="w-1/4">
                <label className="text-sm font-medium text-gray-700">AGE:</label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-b border-gray-300 font-bold"
                />
              </div>
            </div>
  
            {/* Physician's Name and Phone */}
            <div className="flex justify-between mb-4">
              <div className="w-1/2 mr-4">
                <label className="text-sm font-medium text-gray-700">PHYSICIANS NAME:</label>
                <input
                  type="text"
                  name="physiciansName"
                  value={formData.physiciansName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-b border-gray-300 font-bold"
                />
              </div>
              <div className="w-1/2">
                <label className="text-sm font-medium text-gray-700">PHONE:</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-b border-gray-300 font-bold"
                />
              </div>
            </div>
          </div>
  
          {/* PAR-Q Questions */}
          <h2 className="text-xl font-bold mb-4 text-center">PHYSICAL ACTIVITY READINESS QUESTIONNAIRE (PAR-Q)</h2>
  
  Aswin Arsha, [10/1/24 6:40 PM]
  <div className="mx-auto" style={{ width: '90%' }}>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="w-10 text-center py-2 px-2 font-bold border-b border-gray-300">#</th>
                  <th className="text-left py-2 px-2 font-bold border-b border-gray-300 border-l">Questions</th>
                  <th className="w-16 text-center py-2 font-bold border-b border-gray-300">Yes</th>
                  <th className="w-16 text-center py-2 font-bold border-b border-gray-300">No</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Has your doctor ever said that you have a heart condition and that you should only perform physical activity recommended by a doctor?',
                  'Do you feel pain in your chest when you perform physical activity?',
                  'In the past month, have you had chest pain when you were not performing any physical activity?',
                  'Do you lose your balance because of dizziness or do you ever lose consciousness?',
                  'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
                  'Is your doctor currently prescribing any medication for your blood pressure or for a heart condition?',
                  'Do you know of any other reason why you should not engage in physical activity?',
                ].map((question, index) => renderYesNoQuestion(
                  index,
                  question,
                  null, // No fieldName needed for PAR-Q
                  false, // PAR-Q does not require explanation
                  'parq' // Section identifier
                ))}
              </tbody>
            </table>
          </div>
  
          <p className="text-sm italic mb-8">
            If you have answered "Yes" to one or more of the above questions, consult your physician before
            engaging in physical activity. Tell your physician which questions you answered "Yes" to. After a
            medical evaluation, seek advice from your physician on what type of activity is suitable for your
            current condition.
          </p>
  
          {/* GENERAL & MEDICAL QUESTIONNAIRE */}
          <h2 className="text-xl font-bold mb-4 text-center">GENERAL & MEDICAL QUESTIONNAIRE</h2>
  
          <div className="mx-auto" style={{ width: '90%' }}>
            {/* Occupational Questions */}
            <h3 className="font-bold mb-2">Occupational Questions</h3>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                {/* Occupation Question (Input Only) */}
                {renderInputQuestion(
                  'What is your current occupation?',
                  'occupation'
                )}
  
                {/* Other Occupational Questions with Yes/No */}
                {renderYesNoQuestion(
                  0,
                  'Does your occupation require extended periods of sitting?',
                  'requiresSitting',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  1,
                  'Does your occupation require extended periods of repetitive movements?',
                  'requiresRepetitive',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  2,
                  'Does your occupation require you to wear shoes with a heel (dress shoes)?',
                  'wearsHeels',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  3,
                  'Does your occupation cause you anxiety (mental stress)?',
                  'causesAnxiety',
                  true,
                  'general'
                )}
              </tbody>
            </table>
  
  {/* Recreational Questions */}
            <h3 className="font-bold mb-2">Recreational Questions</h3>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                {renderYesNoQuestion(
                  4,
                  'Do you partake in any recreational activities (golf, tennis, skiing, etc.)?',
                  'recreationalActivities',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  5,
                  'Do you have any hobbies (reading, gardening, working on cars, exploring the Internet, etc.)?',
                  'hobbies',
                  true,
                  'general'
                )}
              </tbody>
            </table>
  
            {/* Medical Questions */}
            <h3 className="font-bold mb-2">Medical Questions</h3>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                {renderYesNoQuestion(
                  6,
                  'Have you ever had any pain or injuries (ankle, knee, hip, back, shoulder, etc.)?',
                  'painOrInjuries',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  7,
                  'Have you ever had any surgeries?',
                  'surgeries',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  8,
                  'Has a medical doctor ever diagnosed you with a chronic disease, such as coronary heart disease, coronary artery disease, hypertension, high cholesterol, or diabetes?',
                  'chronicDiseases',
                  true,
                  'general'
                )}
                {renderYesNoQuestion(
                  9,
                  'Are you currently taking any medication?',
                  'medications',
                  true,
                  'general'
                )}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Print Button */}
        <div className="flex mt-6 justify-end mb-4">
    <button 
      onClick={handlePrint} 
      className="print-button px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
    >
      Print Form
    </button>
  </div>
  
      </div>
    );
  };
  
  export default PARQForm;