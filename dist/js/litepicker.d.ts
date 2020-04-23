import { Calendar, CalendarOptions } from './calendar';
export interface LitepickerOptions extends Omit<CalendarOptions, 'startDate' | 'endDate'> {
    startDate?: Date | string | number;
    endDate?: Date | string | number;
}
export declare class Litepicker extends Calendar {
    private triggerElement?;
    private backdrop;
    private readonly pluralSelector;
    constructor(options: LitepickerOptions);
    updateInput(): void;
    isShown(): boolean | null;
    private onInit;
    private parseInput;
    private isSamePicker;
    private shouldShown;
    private shouldResetDatePicked;
    private shouldSwapDatePicked;
    private shouldCheckLockDays;
    private shouldCheckBookedDays;
    private onClick;
    private showTooltip;
    private hideTooltip;
    private shouldAllowMouseEnter;
    private shouldAllowRepick;
    private isDayItem;
    private onMouseEnter;
    private onMouseLeave;
    private onKeyDown;
    private onInput;
    private loadPolyfillsForIE11;
}
