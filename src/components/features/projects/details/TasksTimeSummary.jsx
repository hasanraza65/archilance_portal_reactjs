import React, { useState, useEffect, useRef } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { PRESETS } from "./utils";

const ChevronDownIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-slate-500"
        viewBox="0 0 20 20"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
        />
    </svg>
);

const FormGroup = ({ label, children }) => (
    <div className="flex flex-col">
        <label className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
        </label>
        {children}
    </div>
);

const TasksTimeSummary = ({ summary, onDateFilterChange, activeStartDate, activeEndDate }) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
    const [activePreset, setActivePreset] = useState("Select Period");
    const presetDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                presetDropdownRef.current &&
                !presetDropdownRef.current.contains(event.target)
            ) {
                setIsPresetDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const createDateWithoutTimezoneShift = (dateString) => {
            if (!dateString) return null;
            return new Date(`${dateString}T00:00:00`);
        };
        const newStartDate = createDateWithoutTimezoneShift(activeStartDate);
        const newEndDate = createDateWithoutTimezoneShift(activeEndDate);
        setStartDate(newStartDate);
        setEndDate(newEndDate);

        if (!newStartDate && !newEndDate) {
            setActivePreset("Select Period");
        } else {
            let matchedPreset = "Custom";
            for (const preset of PRESETS) {
                const [presetStart, presetEnd] = preset.func();
                if (presetStart.toDateString() === newStartDate?.toDateString() && presetEnd.toDateString() === newEndDate?.toDateString()) {
                    matchedPreset = preset.label;
                    break;
                }
            }
            setActivePreset(matchedPreset);
        }
    }, [activeStartDate, activeEndDate]);

    const filteredSummary = summary.filter((task) => task.total_hours > 0);

    const totalSeconds = filteredSummary.reduce(
        (acc, task) => acc + (task.total_hours || 0),
        0
    );
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalTimeFormatted = `${totalHours}h ${totalMinutes}m`;

    const toLocalDateString = (date) => {
        if (!date) return null;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleApplyFilter = () => {
        onDateFilterChange({
            start_date: toLocalDateString(startDate),
            end_date: toLocalDateString(endDate),
        });
    };

    const handleClearFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setActivePreset("Select Period");
        onDateFilterChange({ start_date: null, end_date: null });
    };

    const handlePresetSelect = (preset) => {
        const [start, end] = preset.func();
        setStartDate(start);
        setEndDate(end);
        setActivePreset(preset.label);
        setIsPresetDropdownOpen(false);

        if (onDateFilterChange) {
            onDateFilterChange({
                start_date: toLocalDateString(start),
                end_date: toLocalDateString(end),
            });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="space-y-4">

                    <div>
                        <FormGroup label="Period">
                            <div className="relative" ref={presetDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                                    className="form-input bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-4 py-2 h-[40px] w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 ease-in-out"
                                >
                                    <span className="text-slate-800 dark:text-slate-200 truncate">
                                        {activePreset}
                                    </span>
                                    <ChevronDownIcon />
                                </button>
                                <div
                                    className={`absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-10 p-1 transition-all duration-200 ease-out transform origin-top ${isPresetDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                                >
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset)}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FormGroup>
                    </div>

                    <div>
                        <FormGroup label="Start Date">
                            <Flatpickr
                                value={startDate}
                                onChange={(dates) => {
                                    setStartDate(dates[0]);
                                    setActivePreset("Custom");
                                }}
                                className="form-control h-[40px] w-full"
                                options={{
                                    altInput: true,
                                    altFormat: "F j, Y",
                                    dateFormat: "Y-m-d",
                                }}
                                placeholder="Select start date"
                            />
                        </FormGroup>
                    </div>
                    <div>
                        <FormGroup label="End Date">
                            <Flatpickr
                                value={endDate}
                                onChange={(dates) => {
                                    setEndDate(dates[0]);
                                    setActivePreset("Custom");
                                }}
                                className="form-control h-[40px] w-full"
                                options={{
                                    altInput: true,
                                    altFormat: "F j, Y",
                                    dateFormat: "Y-m-d",
                                    minDate: startDate,
                                }}
                                placeholder="Select end date"
                            />
                        </FormGroup>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleApplyFilter}
                            className="btn btn-dark w-full h-[40px]"
                        >
                            Filter
                        </button>
                        <button
                            onClick={handleClearFilter}
                            className="btn btn-light w-full h-[40px]"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Total Time Worked: {totalTimeFormatted}
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                            <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                                Task
                            </th>
                            <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                                Time Spent
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSummary && filteredSummary.length > 0 ? (
                            filteredSummary.map((task) => (
                                <tr
                                    key={task.task_id}
                                    className="border-b border-slate-200 dark:border-slate-600 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                >
                                    <td className="p-3 align-top font-medium text-slate-800 dark:text-slate-200">
                                        {task.task_title || "Untitled Task"}
                                    </td>
                                    <td className="p-3 align-top text-slate-600 dark:text-slate-300">
                                        {task.total_hours_formatted || "N/A"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="text-center text-slate-500 py-6">
                                    No time logs available for the selected dates.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TasksTimeSummary;
