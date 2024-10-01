// ContactCard.js
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const ContactCard = ({ lead, index, handleContactOpen }) => {
  return (
    <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => handleContactOpen(lead)}
          className="bg-white p-2 rounded-md shadow-md mb-2 cursor-pointer"
        >
          <h3 className="text-md font-semibold">{lead.name}</h3>
          <p className="text-sm text-gray-600">Mobile: {lead.mobile_number}</p>
          <p className="text-sm text-gray-600">
            Next Follow Up:{' '}
            {lead.next_follow_up_date
              ? new Date(lead.next_follow_up_date).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      )}
    </Draggable>
  );
};

export default ContactCard;
