"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            navLayout="around"
            classNames={{
                root: `${defaultClassNames.root}`,
                months: `${defaultClassNames.months}`,
                month: `${defaultClassNames.month} relative`,
                month_caption: `${defaultClassNames.month_caption} flex justify-center relative items-center`,
                caption_label: `${defaultClassNames.caption_label} text-sm font-medium`,
                nav: `${defaultClassNames.nav} absolute inset-0 flex items-center justify-between px-1 pointer-events-none`,
                button_previous: `${defaultClassNames.button_previous} !h-7 !w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground z-10 pointer-events-auto !top-2 absolute`,
                button_next: `${defaultClassNames.button_next} !h-7 !w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground z-10 pointer-events-auto !top-2 absolute`,
                month_grid: `${defaultClassNames.month_grid} w-full border-collapse space-y-1`,
                weekdays: `${defaultClassNames.weekdays} flex w-full gap-1`,
                weekday: `${defaultClassNames.weekday} text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]`,
                week: `${defaultClassNames.week} flex w-full mt-2 gap-1`,
                day: `${defaultClassNames.day} h-9 w-9 text-center text-sm p-0 relative`,
                day_button: `${defaultClassNames.day_button} h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground`,
                range_end: `${defaultClassNames.range_end} day-range-end`,
                selected: `bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground`,
                today: `bg-accent/50 text-accent-foreground rounded-full`,
                outside: `${defaultClassNames.outside} day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30`,
                disabled: `${defaultClassNames.disabled} text-muted-foreground opacity-50`,
                range_middle: `${defaultClassNames.range_middle} aria-selected:bg-accent aria-selected:text-accent-foreground`,
                hidden: `${defaultClassNames.hidden} invisible`,
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight
                    return <Icon className="h-4 w-4" />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
