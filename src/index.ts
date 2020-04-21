import { DateTime } from './datetime';
import { Litepicker } from './litepicker';

declare module './litepicker' {
  interface Litepicker {
    show(element?: HTMLElement): void;
    hide(): void;

    getDate(): Date | null;
    getStartDate(): Date | null;
    getEndDate(): Date | null;

    setDate(date: DateTime): void;
    setStartDate(date: DateTime): void;
    setEndDate(date: DateTime): void;
    setDateRange(date1: DateTime, date2: DateTime): void;

    setLockDays(array: [any]): void;
    setBookedDays(array: [any]): void;
    setHighlightedDays(array: [any]): void;

    gotoDate(date: DateTime, idx: number): void;

    setOptions(options: any): any;

    clearSelection(): void;

    destroy(): void;
  }
}

export { Litepicker };
export default Litepicker;
