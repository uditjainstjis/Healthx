// src/app/dashboard/page.jsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // For water goal
import { cn } from "@/lib/utils"; // For conditional classes
import {
    ArrowLeft,
    ListChecks,
    CheckCircle2,
    Circle,
    Sparkles,
    Droplet,
    Footprints as StepsIcon,
    Moon,
    Activity,
    Heart,
    Settings as Lungs,
    Loader2,
    GlassWater, // More specific for water
    Utensils, // For meals
    Smile, // For mood
    Minus,
    Plus
} from 'lucide-react';

// --- General Measures (Keep as before) ---
const generalMeasures = [
    { id: 'gen1', icon: Droplet, text: "Stay Hydrated: Aim for 8 glasses of water throughout the day.", color: "text-cyan-600 dark:text-cyan-400" },
    { id: 'gen2', icon: StepsIcon, text: "Move Your Body: Target at least 30 minutes of moderate activity most days.", color: "text-indigo-600 dark:text-indigo-400" },
    { id: 'gen3', icon: Moon, text: "Prioritize Sleep: Aim for 7-9 hours of quality sleep per night.", color: "text-yellow-600 dark:text-yellow-400" },
    { id: 'gen4', icon: Activity, text: "Manage Stress: Incorporate relaxation techniques like deep breathing or meditation.", color: "text-pink-600 dark:text-pink-400" },
    { id: 'gen5', icon: Heart, text: "Eat Balanced Meals: Focus on fruits, vegetables, whole grains, and lean protein.", color: "text-green-600 dark:text-green-400" },
];

// --- Dashboard Component ---
export default function DashboardPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- State for Initial UI Widgets ---
    const [waterIntake, setWaterIntake] = useState(0); // Glasses (e.g., 0-12)
    const waterGoal = 8;
    const [mealsLogged, setMealsLogged] = useState({ breakfast: false, lunch: false, dinner: false });
    const [currentMood, setCurrentMood] = useState(null); // e.g., 'happy', 'neutral', 'sad'

    // --- Load Personalized Tasks ---
    useEffect(() => {
        console.log("Dashboard: Mounting and loading tasks.");
        setIsLoading(true);
        // Simulate slight delay for loading perception if needed
        // setTimeout(() => {
            try {
                const storedTasks = localStorage.getItem('healthTasks');
                if (storedTasks) {
                    const parsedTasks = JSON.parse(storedTasks);
                    setTasks(parsedTasks || []);
                    console.log("Dashboard: Loaded tasks:", parsedTasks?.length || 0);
                } else {
                    setTasks([]);
                    console.log("Dashboard: No personalized tasks found.");
                }
            } catch (error) {
                console.error("Dashboard: Error loading/parsing tasks:", error);
                setTasks([]);
            } finally {
                setIsLoading(false);
            }
        // }, 500); // Optional simulated delay
    }, []);

    // --- Handlers for Initial Widgets ---
    const handleWaterChange = (amount) => {
        setWaterIntake(prev => Math.max(0, Math.min(12, prev + amount))); // Limit 0-12 glasses
    };

    const toggleMealLogged = (meal) => {
        setMealsLogged(prev => ({ ...prev, [meal]: !prev[meal] }));
    };

    const handleMoodSelect = (mood) => {
        setCurrentMood(mood);
    };

    // --- Render Functions ---

    // Render individual task item (for personalized list)
    const renderTaskItem = (task) => (
        <div key={task.id} className={`flex items-center p-3 rounded-md border mb-2 transition-all ${task.isCompleted ? 'bg-muted/50 opacity-60' : 'bg-card hover:bg-muted/30'}`}>
            {task.isCompleted
                ? <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            }
            <span className={`flex-1 text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.description}
            </span>
        </div>
    );

    // Render individual general wellness tip
    const renderGeneralMeasure = (measure) => (
        <div key={measure.id} className="flex items-start p-3 rounded-md border border-dashed mb-2 bg-card/50">
            <measure.icon className={`h-5 w-5 ${measure.color} mr-3 mt-0.5 flex-shrink-0`} />
            <span className="flex-1 text-sm text-muted-foreground">{measure.text}</span>
        </div>
    );

    // Render the initial interactive widgets
    const renderInitialWidgets = () => (
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 transition-opacity duration-300",
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100" // Fade in when loading done
        )}>
            {/* Water Intake Card */}
            <Card className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-900/30 dark:via-background dark:to-cyan-900/30">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center text-blue-800 dark:text-blue-300">
                        <GlassWater className="mr-2 h-5 w-5"/>How much water today?
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-3">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{waterIntake} <span className="text-lg font-normal text-muted-foreground">/ {waterGoal} glasses</span></div>
                    <Progress value={(waterIntake / waterGoal) * 100} className="w-full h-2 bg-blue-100 dark:bg-blue-900 [&>*]:bg-blue-500" />
                    <div className="flex space-x-3">
                        <Button variant="outline" size="icon" onClick={() => handleWaterChange(-1)} disabled={waterIntake <= 0}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleWaterChange(1)} disabled={waterIntake >= 12}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Meal Logging Card */}
            <Card className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-orange-900/30 dark:via-background dark:to-yellow-900/30">
                 <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center text-orange-800 dark:text-orange-300">
                        <Utensils className="mr-2 h-5 w-5" />Log Your Meals
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center pt-2 pb-4">
                     {['breakfast', 'lunch', 'dinner'].map(meal => (
                        <Button
                            key={meal}
                            variant={mealsLogged[meal] ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMealLogged(meal)}
                            className={cn("capitalize transition-all",
                                mealsLogged[meal] ? 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700' : 'text-muted-foreground'
                            )}
                        >
                            {mealsLogged[meal] && <CheckCircle2 className="mr-1.5 h-4 w-4"/>} {meal}
                        </Button>
                     ))}
                </CardContent>
            </Card>

            {/* Mood Check Card - Placeholder Example */}
            {/* <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center">
                        <Smile className="mr-2 h-5 w-5"/>How are you feeling?
                    </CardTitle>
                </CardHeader>
                 <CardContent className="flex justify-around">
                    <Button variant={currentMood === 'happy' ? 'default' : 'ghost'} size="icon" onClick={() => handleMoodSelect('happy')}>😊</Button>
                     <Button variant={currentMood === 'neutral' ? 'default' : 'ghost'} size="icon" onClick={() => handleMoodSelect('neutral')}>😐</Button>
                    <Button variant={currentMood === 'sad' ? 'default' : 'ghost'} size="icon" onClick={() => handleMoodSelect('sad')}>😔</Button>
                 </CardContent>
             </Card> */}
        </div>
    );


    // --- Main Return ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Increased max-width */}
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2"> {/* Adjusted margin */}
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <h1 className="text-3xl font-bold mb-6 text-left"> {/* Align left */}
                Your Health Hub
            </h1>

            {/* Always render initial widgets container, content depends on loading state */}
            {renderInitialWidgets()}

            {/* Conditional Rendering AFTER loading */}
            {!isLoading && (
                tasks.length > 0 ? (
                    // Display Specific Tasks from localStorage
                    <Card className="mt-8 animate-fade-in"> {/* Added fade-in animation */}
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg text-primary">
                               <ListChecks className="mr-2 h-5 w-5"/> Personalized Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Based on your recent activity and AI analysis. Manage these in the chat panel.
                            </p>
                            {tasks.filter(t => !t.isCompleted).map(renderTaskItem)}
                            {tasks.filter(t => t.isCompleted).length > 0 && (
                                <h4 className="text-sm font-medium text-muted-foreground mt-4 mb-2 pt-4 border-t">Completed</h4>
                            )}
                            {tasks.filter(t => t.isCompleted).map(renderTaskItem)}
                        </CardContent>
                    </Card>
                ) : (
                    // Display General Preventive Measures if no tasks
                     <Card className="mt-8 animate-fade-in border-border/50"> {/* Added fade-in animation */}
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg text-secondary-foreground">
                               <Sparkles className="mr-2 h-5 w-5 text-yellow-500"/> General Wellness Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Focus on these general tips for a healthy lifestyle:
                            </p>
                            {generalMeasures.map(renderGeneralMeasure)}
                         </CardContent>
                    </Card>
                )
            )}

             {/* Loading Indicator (Optional: Place it subtly if desired when isLoading) */}
             {/* {isLoading && <div className="absolute top-4 right-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/></div>} */}

        </div>
    );
}


// Add simple fade-in animation in globals.css if you don't have it
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
*/