import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type SortOption = 
  | "name-asc"
  | "name-desc"
  | "date-asc"
  | "date-desc"
  | "company-asc"
  | "company-desc"
  | "created-asc"
  | "created-desc";

export interface FilterState {
  tags: string[];
  tagLogic: "AND" | "OR";
  companies: string[];
  sources: string[];
  meetingDateFrom: Date | undefined;
  meetingDateTo: Date | undefined;
  createdDateFrom: Date | undefined;
  createdDateTo: Date | undefined;
  followUpFilter: "all" | "upcoming" | "overdue" | "today" | "thisWeek";
  sortBy: SortOption;
}

interface AdvancedFilterPanelProps {
  allTags: string[];
  allCompanies: string[];
  allSources: string[];
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export const AdvancedFilterPanel = ({
  allTags,
  allCompanies,
  allSources,
  filterState,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: AdvancedFilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filterState);

  // Sync localFilters with filterState when it changes externally
  useEffect(() => {
    setLocalFilters(filterState);
  }, [filterState]);

  const updateFilter = (updates: Partial<FilterState>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter((t) => t !== tag)
      : [...localFilters.tags, tag];
    updateFilter({ tags: newTags });
  };

  const handleCompanyToggle = (company: string) => {
    const newCompanies = localFilters.companies.includes(company)
      ? localFilters.companies.filter((c) => c !== company)
      : [...localFilters.companies, company];
    updateFilter({ companies: newCompanies });
  };

  const handleSourceToggle = (source: string) => {
    const newSources = localFilters.sources.includes(source)
      ? localFilters.sources.filter((s) => s !== source)
      : [...localFilters.sources, source];
    updateFilter({ sources: newSources });
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      tags: [],
      tagLogic: "OR",
      companies: [],
      sources: [],
      meetingDateFrom: undefined,
      meetingDateTo: undefined,
      createdDateFrom: undefined,
      createdDateTo: undefined,
      followUpFilter: "all",
      sortBy: "created-desc",
    };
    setLocalFilters(emptyFilters);
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Advanced Filters</h3>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sort By</Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={(value: SortOption) => updateFilter({ sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created-desc">
                      <div className="flex items-center gap-2">
                        <SortDesc className="w-4 h-4" />
                        Recently Added
                      </div>
                    </SelectItem>
                    <SelectItem value="created-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="date-asc">Meeting Date (Oldest)</SelectItem>
                    <SelectItem value="date-desc">Meeting Date (Newest)</SelectItem>
                    <SelectItem value="company-asc">Company (A-Z)</SelectItem>
                    <SelectItem value="company-desc">Company (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Tags</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={localFilters.tagLogic === "AND" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateFilter({ tagLogic: "AND" })}
                      >
                        AND
                      </Button>
                      <Button
                        variant={localFilters.tagLogic === "OR" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateFilter({ tagLogic: "OR" })}
                      >
                        OR
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                    {allTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={localFilters.tags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label
                          htmlFor={`tag-${tag}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Filter */}
              {allCompanies.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Company</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                    {allCompanies.map((company) => (
                      <div key={company} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company}`}
                          checked={localFilters.companies.includes(company)}
                          onCheckedChange={() => handleCompanyToggle(company)}
                        />
                        <Label
                          htmlFor={`company-${company}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {company}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Filter */}
              {allSources.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Source</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                    {allSources.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source}`}
                          checked={localFilters.sources.includes(source)}
                          onCheckedChange={() => handleSourceToggle(source)}
                        />
                        <Label
                          htmlFor={`source-${source}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Meeting Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.meetingDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.meetingDateFrom ? (
                          format(localFilters.meetingDateFrom, "MMM dd, yyyy")
                        ) : (
                          <span>From</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.meetingDateFrom}
                        onSelect={(date) => {
                          updateFilter({ meetingDateFrom: date });
                          // If "to" date is before "from" date, clear it
                          if (date && localFilters.meetingDateTo && date > localFilters.meetingDateTo) {
                            updateFilter({ meetingDateFrom: date, meetingDateTo: undefined });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.meetingDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.meetingDateTo ? (
                          format(localFilters.meetingDateTo, "MMM dd, yyyy")
                        ) : (
                          <span>To</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.meetingDateTo}
                        onSelect={(date) => {
                          updateFilter({ meetingDateTo: date });
                          // If "from" date is after "to" date, clear it
                          if (date && localFilters.meetingDateFrom && date < localFilters.meetingDateFrom) {
                            updateFilter({ meetingDateFrom: undefined, meetingDateTo: date });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Follow-up Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Follow-up Status</Label>
                <Select
                  value={localFilters.followUpFilter}
                  onValueChange={(value: "all" | "upcoming" | "overdue" | "today" | "thisWeek") =>
                    updateFilter({ followUpFilter: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="upcoming">Upcoming Follow-ups</SelectItem>
                    <SelectItem value="overdue">Overdue Follow-ups</SelectItem>
                    <SelectItem value="today">Follow-up Today</SelectItem>
                    <SelectItem value="thisWeek">Follow-up This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Created Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Created Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.createdDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.createdDateFrom ? (
                          format(localFilters.createdDateFrom, "MMM dd, yyyy")
                        ) : (
                          <span>From</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.createdDateFrom}
                        onSelect={(date) => {
                          updateFilter({ createdDateFrom: date });
                          // If "to" date is before "from" date, clear it
                          if (date && localFilters.createdDateTo && date > localFilters.createdDateTo) {
                            updateFilter({ createdDateFrom: date, createdDateTo: undefined });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.createdDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.createdDateTo ? (
                          format(localFilters.createdDateTo, "MMM dd, yyyy")
                        ) : (
                          <span>To</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.createdDateTo}
                        onSelect={(date) => {
                          updateFilter({ createdDateTo: date });
                          // If "from" date is after "to" date, clear it
                          if (date && localFilters.createdDateFrom && date < localFilters.createdDateFrom) {
                            updateFilter({ createdDateFrom: undefined, createdDateTo: date });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {localFilters.tags.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {localFilters.tags.length} tag{localFilters.tags.length > 1 ? "s" : ""} ({localFilters.tagLogic})
                <button
                  onClick={() => updateFilter({ tags: [] })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {localFilters.companies.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {localFilters.companies.length} compan{localFilters.companies.length > 1 ? "ies" : "y"}
                <button
                  onClick={() => updateFilter({ companies: [] })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {localFilters.sources.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {localFilters.sources.length} source{localFilters.sources.length > 1 ? "s" : ""}
                <button
                  onClick={() => updateFilter({ sources: [] })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {(localFilters.meetingDateFrom || localFilters.meetingDateTo) && (
              <Badge variant="secondary" className="gap-1">
                Meeting date
                <button
                  onClick={() => updateFilter({ meetingDateFrom: undefined, meetingDateTo: undefined })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {(localFilters.createdDateFrom || localFilters.createdDateTo) && (
              <Badge variant="secondary" className="gap-1">
                Created date
                <button
                  onClick={() => updateFilter({ createdDateFrom: undefined, createdDateTo: undefined })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {localFilters.followUpFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Follow-up: {localFilters.followUpFilter}
                <button
                  onClick={() => updateFilter({ followUpFilter: "all" })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {localFilters.sortBy !== "created-desc" && (
              <Badge variant="secondary" className="gap-1">
                Sorted
                <button
                  onClick={() => updateFilter({ sortBy: "created-desc" })}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

