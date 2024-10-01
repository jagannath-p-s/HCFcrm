import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const FilterDialog = ({
  open,
  onClose,
  leadSources,
  filterLeadSource,
  filterStartDate,
  filterEndDate,
  filterDays,
  handleFilterLeadSourceChange,
  handleFilterStartDateChange,
  handleFilterEndDateChange,
  handleFilterDaysChange,
  handleClearFilter,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Filter Contacts</DialogTitle>
        </DialogHeader>

        {/* Lead Source */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-source">Lead Source</Label>
            <Select
              value={filterLeadSource || 'all'}
              onValueChange={handleFilterLeadSourceChange}
            >
              <SelectTrigger id="lead-source">
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <em>All</em>
                </SelectItem>
                {leadSources.map((source) => (
                  <SelectItem key={source.id} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              type="date"
              id="start-date"
              value={filterStartDate || ""}
              onChange={(e) => handleFilterStartDateChange(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              type="date"
              id="end-date"
              value={filterEndDate || ""}
              onChange={(e) => handleFilterEndDateChange(e.target.value)}
            />
          </div>

          {/* Follow-up Days */}
          <div className="space-y-2">
            <Label htmlFor="follow-up-days">
              Show contacts with follow-up in next N days
            </Label>
            <Input
              type="number"
              id="follow-up-days"
              value={filterDays || ""}
              onChange={(e) => handleFilterDaysChange(e.target.value)}
              min={0}
            />
          </div>
        </div>

        {/* Dialog Actions */}
        <DialogFooter>
          <Button variant="secondary" onClick={handleClearFilter}>
            Clear Filter
          </Button>
          <Button variant="primary" onClick={onClose}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
