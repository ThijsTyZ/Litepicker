import { Calendar, CalendarOptions } from './calendar';
export { Calendar };
export declare class Litepicker extends Calendar {
    private triggerElement?;
    private backdrop;
    private readonly pluralSelector;
    constructor(options: CalendarOptions);
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
