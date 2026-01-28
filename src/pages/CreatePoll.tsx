import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, Clock, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface TimeSlot {
  date: Date;
  times: string[];
}

const CreatePoll = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const exists = selectedDates.some(d => 
      format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    
    if (exists) {
      setSelectedDates(prev => prev.filter(d => 
        format(d, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
      ));
      setTimeSlots(prev => prev.filter(ts => 
        format(ts.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
      ));
    } else {
      setSelectedDates(prev => [...prev, date].sort((a, b) => a.getTime() - b.getTime()));
      setTimeSlots(prev => [...prev, { date, times: [] }]);
    }
  };

  const formatTimeSlot = (start: string, end: string) => {
    // Convert 24h to 12h format for display
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const addTimeToDate = (date: Date) => {
    if (!startTime || !endTime) {
      toast({ title: "Please enter both start and end times", variant: "destructive" });
      return;
    }
    
    if (startTime >= endTime) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    
    const timeSlot = formatTimeSlot(startTime, endTime);
    
    setTimeSlots(prev => prev.map(ts => {
      if (format(ts.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")) {
        if (!ts.times.includes(timeSlot)) {
          return { ...ts, times: [...ts.times, timeSlot].sort() };
        }
      }
      return ts;
    }));
    setStartTime("");
    setEndTime("");
  };

  const removeTimeFromDate = (date: Date, time: string) => {
    setTimeSlots(prev => prev.map(ts => {
      if (format(ts.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")) {
        return { ...ts, times: ts.times.filter(t => t !== time) };
      }
      return ts;
    }));
  };

  const copyTimeSlotsToDate = (sourceDate: Date, targetDate: Date) => {
    const sourceSlot = timeSlots.find(ts => 
      format(ts.date, "yyyy-MM-dd") === format(sourceDate, "yyyy-MM-dd")
    );
    if (!sourceSlot || sourceSlot.times.length === 0) return;

    setTimeSlots(prev => prev.map(ts => {
      if (format(ts.date, "yyyy-MM-dd") === format(targetDate, "yyyy-MM-dd")) {
        const newTimes = [...new Set([...ts.times, ...sourceSlot.times])].sort();
        return { ...ts, times: newTimes };
      }
      return ts;
    }));
    toast({ title: `Copied time slots to ${format(targetDate, "MMM d")}` });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    if (selectedDates.length === 0) {
      toast({ title: "Please select at least one date", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({ title: title.trim(), description: description.trim() || null })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options for each date/time combination
      const options: { poll_id: string; date: string; time_slot: string | null }[] = [];
      
      for (const ts of timeSlots) {
        if (ts.times.length === 0) {
          // No specific times, just the date
          options.push({
            poll_id: poll.id,
            date: format(ts.date, "yyyy-MM-dd"),
            time_slot: null
          });
        } else {
          // Add each time slot
          for (const time of ts.times) {
            options.push({
              poll_id: poll.id,
              date: format(ts.date, "yyyy-MM-dd"),
              time_slot: time
            });
          }
        }
      }

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(options);

      if (optionsError) throw optionsError;

      // Navigate to share page with both poll ID and admin token
      navigate(`/poll/${poll.id}/share?admin=${poll.admin_token}`);
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({ title: "Failed to create poll", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create a Meeting Poll</h1>
          <p className="text-muted-foreground mt-2">
            Select potential dates and times, then share with participants to find the best time.
          </p>
        </div>

        <div className="space-y-6">
          {/* Title & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>Give your meeting a name and optional description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Team Standup Planning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any details about the meeting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Dates</CardTitle>
              <CardDescription>Click on dates to add or remove them from the poll</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => {
                    if (!dates) return;
                    // Find which date was added or removed
                    const prevSet = new Set(selectedDates.map(d => format(d, "yyyy-MM-dd")));
                    const newSet = new Set(dates.map(d => format(d, "yyyy-MM-dd")));
                    
                    // Find added date
                    for (const d of dates) {
                      const key = format(d, "yyyy-MM-dd");
                      if (!prevSet.has(key)) {
                        handleDateSelect(d);
                        return;
                      }
                    }
                    
                    // Find removed date
                    for (const d of selectedDates) {
                      const key = format(d, "yyyy-MM-dd");
                      if (!newSet.has(key)) {
                        handleDateSelect(d);
                        return;
                      }
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border pointer-events-auto"
                />
              </div>

              {selectedDates.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-sm">Selected Dates & Time Slots</h4>
                  {timeSlots.map((ts) => (
                    <div key={format(ts.date, "yyyy-MM-dd")} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{format(ts.date, "EEEE, MMMM d, yyyy")}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDateSelect(ts.date)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {ts.times.map((time) => (
                          <Badge key={time} variant="secondary" className="gap-1">
                            {time}
                            <button
                              onClick={() => removeTimeFromDate(ts.date, time)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {ts.times.length === 0 && (
                          <span className="text-sm text-muted-foreground">All day (no specific times)</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Clock className="h-4 w-4" />
                              Add Time Slot
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4" align="start">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Start</Label>
                                  <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-28"
                                  />
                                </div>
                                <span className="mt-5 text-muted-foreground">–</span>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">End</Label>
                                  <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-28"
                                  />
                                </div>
                              </div>
                              {startTime && (
                                <div className="flex flex-wrap gap-1">
                                  <Label className="text-xs text-muted-foreground w-full mb-1">Quick duration:</Label>
                                  {[15, 30, 45, 60, 90, 120].map((minutes) => {
                                    const calculateEndTime = () => {
                                      const [h, m] = startTime.split(':').map(Number);
                                      const totalMinutes = h * 60 + m + minutes;
                                      const endH = Math.floor(totalMinutes / 60) % 24;
                                      const endM = totalMinutes % 60;
                                      return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                                    };
                                    return (
                                      <Button
                                        key={minutes}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setEndTime(calculateEndTime())}
                                      >
                                        {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                                      </Button>
                                    );
                                  })}
                                </div>
                              )}
                              <Button size="sm" onClick={() => addTimeToDate(ts.date)} className="w-full gap-2">
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {ts.times.length > 0 && selectedDates.length > 1 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Copy className="h-4 w-4" />
                                Copy to...
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" align="start">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Copy time slots to:</Label>
                                {timeSlots
                                  .filter(otherTs => format(otherTs.date, "yyyy-MM-dd") !== format(ts.date, "yyyy-MM-dd"))
                                  .map((otherTs) => (
                                    <div
                                      key={format(otherTs.date, "yyyy-MM-dd")}
                                      className="flex items-center justify-between py-1"
                                    >
                                      <span className="text-sm">{format(otherTs.date, "EEE, MMM d")}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => copyTimeSlotsToDate(ts.date, otherTs.date)}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !title.trim() || selectedDates.length === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll;
