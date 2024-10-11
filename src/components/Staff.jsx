import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, XCircle, MoreVertical } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  min,
  endOfDay,
} from "date-fns";
import StaffDialog from "./StaffDialog";

const Staff = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [late, setLate] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, "MMMM yyyy");
  });
  const [isViewAttendanceOpen, setIsViewAttendanceOpen] = useState(false);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [attendanceMonth, setAttendanceMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttendanceDataForMonth();
  }, [selectedMonth]);

  const fetchAttendanceDataForMonth = async () => {
    try {
      const [month, year] = selectedMonth.split(" ");
      const firstDay = startOfMonth(new Date(`${month} 1, ${year}`));
      const lastDay = endOfMonth(firstDay);
      const today = new Date();
      const lastRelevantDay = min([lastDay, today]);
      const daysInMonth = eachDayOfInterval({
        start: firstDay,
        end: lastRelevantDay,
      });

      const { data: staffsData, error: staffsError } = await supabase
        .from("staffs")
        .select("*");
      if (staffsError) throw staffsError;

      const { data: accessLogs, error: logsError } = await supabase
        .from("access_logs")
        .select("*")
        .gte("timestamp", firstDay.toISOString())
        .lte("timestamp", lastRelevantDay.toISOString());
      if (logsError) throw logsError;

      const attendanceMap = staffsData.reduce((acc, staff) => {
        acc[staff.user_id] = {
          id: staff.user_id,
          name: staff.username,
          role: staff.role || "Staff",
          daysPresent: 0,
          daysLate: 0,
          daysAbsent: daysInMonth.length,
          totalCheckInMinutes: 0,
          checkInCount: 0,
          status: "Absent",
          checkIn: "-",
          checkOut: "-",
        };
        return acc;
      }, {});

      for (const day of daysInMonth) {
        for (const staff of staffsData) {
          const staffLogs = accessLogs
            .filter(
              (log) =>
                log.user_id === staff.user_id &&
                isSameDay(parseISO(log.timestamp), day)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          if (staffLogs.length > 0) {
            let checkInTime = null;
            let checkOutTime = null;
            let isCheckIn = true;

            for (let i = 0; i < staffLogs.length; i++) {
              const log = staffLogs[i];
              const timestamp = parseISO(log.timestamp);

              if (isCheckIn) {
                if (!checkInTime || timestamp < checkInTime) {
                  checkInTime = timestamp;
                }
              } else {
                if (!checkOutTime || timestamp > checkOutTime) {
                  checkOutTime = timestamp;
                }
              }

              isCheckIn = !isCheckIn;
            }

            if (!checkOutTime && checkInTime) {
              checkOutTime = endOfDay(checkInTime);
            }

            const checkInTimeStr = checkInTime
              ? format(checkInTime, "HH:mm")
              : "-";
            const checkOutTimeStr = checkOutTime
              ? format(checkOutTime, "HH:mm")
              : "-";

            const checkInTotalMinutes =
              checkInTime.getHours() * 60 + checkInTime.getMinutes();
            const lateThreshold = "09:15";
            const [lateThresholdHours, lateThresholdMinutes] = lateThreshold
              .split(":")
              .map(Number);
            const lateThresholdTotalMinutes =
              lateThresholdHours * 60 + lateThresholdMinutes;
            const status =
              checkInTotalMinutes <= lateThresholdTotalMinutes
                ? "Present"
                : "Late";

            attendanceMap[staff.user_id].daysAbsent -= 1;
            attendanceMap[staff.user_id].daysPresent += 1;
            if (status === "Late") {
              attendanceMap[staff.user_id].daysLate += 1;
            }
            attendanceMap[staff.user_id].totalCheckInMinutes +=
              checkInTotalMinutes;
            attendanceMap[staff.user_id].checkInCount += 1;

            if (isSameDay(day, today)) {
              attendanceMap[staff.user_id].status = status;
              attendanceMap[staff.user_id].checkIn = checkInTimeStr;
              attendanceMap[staff.user_id].checkOut = checkOutTimeStr;
            }
          }
        }
      }

      const attendanceList = Object.values(attendanceMap);
      const presentCount = attendanceList.filter(
        (staff) => staff.status === "Present" || staff.status === "Late"
      ).length;
      const lateCount = attendanceList.filter(
        (staff) => staff.status === "Late"
      ).length;
      const absentCount = attendanceList.filter(
        (staff) => staff.status === "Absent"
      ).length;

      setAttendanceData(attendanceList);
      setTotalStaff(staffsData.length);
      setPresent(presentCount);
      setLate(lateCount);
      setAbsent(absentCount);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  // View Attendance
  useEffect(() => {
    if (isViewAttendanceOpen && selectedStaff) {
      openViewAttendance(selectedStaff);
    }
  }, [attendanceMonth]);

  const openViewAttendance = async (staff) => {
    setSelectedStaff(staff);
    setIsViewAttendanceOpen(true);
    const [month, year] = attendanceMonth.split(" ");
    const firstDay = startOfMonth(new Date(`${month} 1, ${year}`));
    const lastDay = endOfMonth(firstDay);

    const { data: staffLogs, error } = await supabase
      .from("access_logs")
      .select("*")
      .eq("user_id", staff.id)
      .gte("timestamp", firstDay.toISOString())
      .lte("timestamp", lastDay.toISOString());

    if (error) {
      console.error("Error fetching staff logs:", error);
    } else {
      const groupedLogs = groupLogsByDate(staffLogs);
      setStaffAttendance(groupedLogs);
    }
  };

  const groupLogsByDate = (logs) => {
    return logs.reduce((acc, log) => {
      const date = format(parseISO(log.timestamp), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { checkIn: null, checkOut: null };
      }

      if (log.punch === 0) {
        acc[date].checkIn = format(parseISO(log.timestamp), "HH:mm");
      } else {
        acc[date].checkOut = format(parseISO(log.timestamp), "HH:mm");
      }

      return acc;
    }, {});
  };

  // Edit Staff
  const openEditDialog = async (staff) => {
    try {
      const { data, error } = await supabase
        .from("staffs")
        .select("*")
        .eq("user_id", staff.id)
        .single();

      if (error) throw error;

      setSelectedStaff({
        user_id: data.user_id,
        username: data.username,
        useremail: data.useremail,
        password: "",
        role: data.role,
        mobile_number: data.mobile_number,
        employee_code: data.employee_code,
        salary: data.salary,
      });

      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching staff details:", error);
    }
  };

  // Delete Staff
  const openDeleteDialog = (staff) => {
    setSelectedStaff(staff);
    setIsAlertDialogOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (selectedStaff) {
      const { error } = await supabase
        .from("staffs")
        .delete()
        .eq("user_id", selectedStaff.id);
      if (error) {
        console.error("Error deleting staff:", error);
      } else {
        setIsAlertDialogOpen(false);
        fetchAttendanceDataForMonth();
      }
    }
  };

  const filteredAttendanceData = attendanceData.filter((staff) =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      options.push(format(date, "MMMM yyyy"));
    }
    return options;
  };

  return (
    <div className="p-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absent}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Staff Attendance Details</CardTitle>
            <div className="flex items-center space-x-4">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search staff"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
              <Button
                variant="secondary"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Staff
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Current Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Present</TableHead>
                <TableHead>Days Absent</TableHead>
                <TableHead>Days Late</TableHead>
                {/* <TableHead>Avg Check-in</TableHead> */}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="9" className="text-center">
                    No staff found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{format(new Date(), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "Present"
                            ? "default"
                            : record.status === "Late"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.daysPresent}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.daysAbsent}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.daysLate}
                    </TableCell>
                    {/* <TableCell className="text-center">{record.averageCheckIn}</TableCell> */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <MoreVertical className="h-5 w-5 cursor-pointer" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => openViewAttendance(record)}
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(record)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(record)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Attendance Dialog */}
      <Dialog
        open={isViewAttendanceOpen}
        onOpenChange={setIsViewAttendanceOpen}
      >
        <DialogContent className="h-[500px] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              View Attendance: {selectedStaff && selectedStaff.name}
            </DialogTitle>
            <Select
              value={attendanceMonth}
              onValueChange={setAttendanceMonth}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(staffAttendance).length === 0 ? (
                <TableRow>
                  <TableCell colSpan="3" className="text-center">
                    No attendance logs found.
                  </TableCell>
                </TableRow>
              ) : (
                Object.keys(staffAttendance).map((date, index) => (
                  <TableRow key={index}>
                    <TableCell>{date}</TableCell>
                    <TableCell>
                      {staffAttendance[date].checkIn || "-"}
                    </TableCell>
                    <TableCell>
                      {staffAttendance[date].checkOut || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <StaffDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        isEdit={false}
        onSuccess={fetchAttendanceDataForMonth}
      />

      {/* Edit Staff Dialog */}
      <StaffDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        isEdit={true}
        staffData={selectedStaff}
        onSuccess={fetchAttendanceDataForMonth}
      />

      {/* Delete Staff Alert Dialog */}
      <AlertDialog
        open={isAlertDialogOpen}
        onOpenChange={setIsAlertDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this staff member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will permanently delete the staff
              member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Staff;
