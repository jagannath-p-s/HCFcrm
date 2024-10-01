import React from 'react';
import { Button } from "@/components/ui/button"; // ShadCN UI Button
import { Input } from "@/components/ui/input";  // ShadCN UI Input
import Tooltip from '@mui/material/Tooltip'; // Material UI Tooltip
import { PlusIcon, FilterIcon } from 'lucide-react';

const Header = ({ onAddClick, onFilterClick, onSearchChange }) => {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-2 sm:px-6 lg:px-8  ">
        <div className="flex justify-between items-center py-3 ">
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Tooltip title="Add a new contact" placement="bottom">
              <Button 
                onClick={onAddClick}
                className="bg-blue-100 text-blue-500 hover:bg-blue-200"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </Tooltip>

            <Tooltip title="Filter contacts" placement="bottom">
              <Button 
                onClick={onFilterClick}
                className="bg-blue-100 text-blue-500 hover:bg-blue-200"
              >
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </Tooltip>
          </div>

          {/* Search Field */}
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Search contacts"
              className="w-72"
              onChange={(e) => onSearchChange(e.target.value)}  // Pass value to onSearchChange
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
