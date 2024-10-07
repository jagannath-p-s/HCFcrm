import React, { useState } from 'react';
import { supabase } from '../client';

const Advance = ({ staffId }) => {
  const [advance, setAdvance] = useState('');

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    await supabase
      .from('staff_salaries')
      .update({ advance_taken: advance })
      .eq('staff_id', staffId);
    setAdvance('');
  };

  return (
    <form onSubmit={handleAdvanceSubmit}>
      <h4>Advance for Staff ID: {staffId}</h4>
      <input
        type="number"
        value={advance}
        onChange={(e) => setAdvance(e.target.value)}
        placeholder="Enter Advance Amount"
      />
      <button type="submit">Submit Advance</button>
    </form>
  );
};

export default Advance;
