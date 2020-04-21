import { Calendar, CalendarOptions } from './calendar';
import { DateTime } from './datetime';
import * as style from './scss/main.scss';
import { findNestedMonthItem, getOrientation, isMobile } from './utils';

export class Litepicker extends Calendar {
  private triggerElement?: Element | null = null;
  private backdrop: HTMLDivElement | null = null;

  private readonly pluralSelector: ((arg: number) => string) | null = null;

  constructor(options: CalendarOptions) {
    super();

    this.options = { ...this.options, ...options };

    if (!this.options.elementEnd) {
      this.options.allowRepick = false;
    }

    if (this.options.lockDays?.length) {
      this.options.lockDays = DateTime.convertArray(
        this.options.lockDays,
        this.options.lockDaysFormat || '',
      );
    }

    if (this.options.bookedDays?.length) {
      this.options.bookedDays = DateTime.convertArray(
        this.options.bookedDays,
        this.options.bookedDaysFormat || '',
      );
    }

    if (this.options.highlightedDays?.length) {
      this.options.highlightedDays = DateTime.convertArray(
        this.options.highlightedDays,
        this.options.highlightedDaysFormat || '',
      );
    }

    if (this.options.hotelMode && !('bookedDaysInclusivity' in options)) {
      this.options.bookedDaysInclusivity = '[)';
    }

    if (this.options.hotelMode && !('disallowBookedDaysInRange' in options)) {
      this.options.disallowBookedDaysInRange = true;
    }

    if (this.options.hotelMode && !('selectForward' in options)) {
      this.options.selectForward = true;
    }

    let [startValue, endValue] = this.parseInput();

    if (this.options.startDate) {
      if (this.options.singleMode || this.options.endDate) {
        startValue = new DateTime(this.options.startDate, this.options.format, this.options.lang);
      }
    }

    if (startValue && this.options.endDate) {
      endValue = new DateTime(this.options.endDate, this.options.format, this.options.lang);
    }

    if (startValue instanceof DateTime && !isNaN(startValue.getTime())) {
      this.options.startDate = startValue;
    }

    if (this.options.startDate && endValue instanceof DateTime && !isNaN(endValue.getTime())) {
      this.options.endDate = endValue;
    }

    if (this.options.singleMode && !(this.options.startDate instanceof DateTime)) {
      this.options.startDate = undefined;
    }
    if (
      !this.options.singleMode &&
      (!(this.options.startDate instanceof DateTime) || !(this.options.endDate instanceof DateTime))
    ) {
      this.options.startDate = undefined;
      this.options.endDate = undefined;
    }

    for (let idx = 0; idx < (this.options.numberOfMonths || 1); idx += 1) {
      const date =
        this.options.startDate instanceof DateTime
          ? this.options.startDate.clone()
          : new DateTime();
      date.setDate(1);
      date.setMonth(date.getMonth() + idx);
      this.calendars[idx] = date;
    }

    if (this.options.showTooltip) {
      if (this.options.tooltipPluralSelector) {
        this.pluralSelector = this.options.tooltipPluralSelector;
      } else {
        try {
          const pluralRules = new Intl.PluralRules(this.options.lang);
          this.pluralSelector = pluralRules.select.bind(pluralRules);
        } catch {
          // fallback
          this.pluralSelector = (arg0: number) => {
            if (Math.abs(arg0) === 0) return 'one';
            return 'other';
          };
        }
      }
    }

    this.loadPolyfillsForIE11();

    this.onInit();
  }

  public updateInput() {
    if (!(this.options.element instanceof HTMLInputElement)) return;

    if (this.options.singleMode && this.options.startDate) {
      this.options.element.value = this.options.startDate.format(
        this.options.format,
        this.options.lang,
      );
    } else if (!this.options.singleMode && this.options.startDate && this.options.endDate) {
      const startValue = this.options.startDate.format(this.options.format, this.options.lang);
      const endValue = this.options.endDate.format(this.options.format, this.options.lang);

      if (this.options.elementEnd) {
        this.options.element.value = startValue;
        this.options.elementEnd.value = endValue;
      } else {
        this.options.element.value = `${startValue} - ${endValue}`;
      }
    }

    if (!this.options.startDate && !this.options.endDate) {
      this.options.element.value = '';

      if (this.options.elementEnd) {
        this.options.elementEnd.value = '';
      }
    }
  }

  public isShown() {
    return this.picker && this.picker.style.display !== 'none';
  }

  public show(el: HTMLElement | null = null) {
    if (!this.picker) return;

    const element = el ? el : this.options?.element;
    this.triggerElement = element;

    if (this.options.inlineMode) {
      this.picker.style.position = 'static';
      this.picker.style.display = 'inline-block';
      this.picker.style.top = '';
      this.picker.style.left = '';
      this.picker.style.bottom = '';
      this.picker.style.right = '';
      return;
    }

    if (this.options.scrollToDate) {
      if (this.options.startDate && (!el || el === this.options.element)) {
        const startDate = this.options.startDate.clone();
        startDate.setDate(1);
        this.calendars[0] = startDate.clone();
      } else if (el && this.options.endDate && el === this.options.elementEnd) {
        const endDate = this.options.endDate.clone();
        endDate.setDate(1);
        if (this.options.numberOfMonths ?? 1 > 1) {
          endDate.setMonth(endDate.getMonth() - (this.options.numberOfMonths ?? 1 - 1));
        }
        this.calendars[0] = endDate.clone();
      }
    }
    const pickerBCR = this.picker.getBoundingClientRect();

    if (this.options.mobileFriendly && isMobile()) {
      this.picker.style.position = 'fixed';
      this.picker.style.display = 'block';

      if (getOrientation() === 'portrait') {
        this.options.numberOfMonths = 1;
        this.options.numberOfColumns = 1;
      } else {
        this.options.numberOfMonths = 2;
        this.options.numberOfColumns = 2;
      }

      this.render();

      this.picker.style.top = `calc(50% - ${pickerBCR.height / 2}px)`;
      this.picker.style.left = `calc(50% - ${pickerBCR.width / 2}px)`;
      this.picker.style.right = '';
      this.picker.style.bottom = '';
      this.picker.style.zIndex = `${this.options.zIndex || ''}`;

      if (this.backdrop) {
        this.backdrop.style.display = 'block';
        this.backdrop.style.zIndex = `${(this.options.zIndex || 0) - 1}`;
      }
      document.body.classList.add(style.litepickerOpen);

      if (typeof this.options.onShow === 'function') {
        this.options.onShow.call(this);
      }

      if (el) {
        el.blur();
      } else {
        this.options.element?.blur();
      }
      return;
    }

    this.render();

    this.picker.style.position = 'absolute';
    this.picker.style.display = 'block';
    this.picker.style.zIndex = `${this.options.zIndex}`;

    if (!element) return;
    const elBCR = element.getBoundingClientRect();

    let top = elBCR.bottom;
    let left = elBCR.left;
    let scrollX = 0;
    let scrollY = 0;
    let topAlt = 0;
    let leftAlt = 0;

    if (this.options.parentEl) {
      const parentBCR = (this.picker.parentNode as HTMLElement).getBoundingClientRect();
      top -= parentBCR.bottom;
      top += elBCR.height;

      if (
        top + pickerBCR.height > window.innerHeight &&
        elBCR.top - parentBCR.top - elBCR.height > 0
      ) {
        topAlt = elBCR.top - parentBCR.top - elBCR.height;
      }

      left -= parentBCR.left;

      if (
        left + pickerBCR.width > window.innerWidth &&
        elBCR.right - parentBCR.right - pickerBCR.width > 0
      ) {
        leftAlt = elBCR.right - parentBCR.right - pickerBCR.width;
      }
    } else {
      scrollX = window.scrollX || window.pageXOffset;
      scrollY = window.scrollY || window.pageYOffset;

      if (top + pickerBCR.height > window.innerHeight && elBCR.top - pickerBCR.height > 0) {
        topAlt = elBCR.top - pickerBCR.height;
      }

      if (left + pickerBCR.width > window.innerWidth && elBCR.right - pickerBCR.width > 0) {
        leftAlt = elBCR.right - pickerBCR.width;
      }
    }

    this.picker.style.top = `${(topAlt ? topAlt : top) + scrollY}px`;
    this.picker.style.left = `${(leftAlt ? leftAlt : left) + scrollX}px`;
    this.picker.style.right = '';
    this.picker.style.bottom = '';

    if (typeof this.options.onShow === 'function') {
      this.options.onShow.call(this);
    }
  }

  public hide() {
    if (!this.isShown()) {
      return;
    }

    this.datePicked.length = 0;
    this.updateInput();

    if (this.options.inlineMode) {
      this.render();
      return;
    }

    if (this.picker) this.picker.style.display = 'none';

    if (typeof this.options.onHide === 'function') {
      this.options.onHide.call(this);
    }

    if (this.options.mobileFriendly && this.backdrop) {
      document.body.classList.remove(style.litepickerOpen);
      this.backdrop.style.display = 'none';
    }
  }

  public getDate(): Date | null {
    return this.getStartDate();
  }

  public getStartDate(): Date | null {
    if (this.options.startDate) {
      const castedObj = this.options.startDate.clone() as DateTime;
      return castedObj.getDateInstance();
    }

    return null;
  }

  public getEndDate(): Date | null {
    if (this.options.endDate) {
      const castedObj = this.options.endDate.clone() as DateTime;
      return castedObj.getDateInstance();
    }

    return null;
  }

  public setDate(date: DateTime) {
    this.setStartDate(date);

    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect.call(this, this.getDate());
    }
  }

  public setStartDate(date: DateTime) {
    if (!date) return;

    this.options.startDate = new DateTime(date, this.options.format, this.options.lang);

    this.updateInput();
  }

  public setEndDate(date: DateTime) {
    if (!date) return;

    this.options.endDate = new DateTime(date, this.options.format, this.options.lang);

    if (
      this.options.startDate &&
      this.options.startDate.getTime() > this.options.endDate.getTime()
    ) {
      this.options.endDate = this.options.startDate.clone();
      this.options.startDate = new DateTime(date, this.options.format, this.options.lang);
    }

    this.updateInput();
  }

  public setDateRange(date1: DateTime, date2: DateTime) {
    // stop repicking by resetting the trigger element
    this.triggerElement = null;

    this.setStartDate(date1);
    this.setEndDate(date2);

    this.updateInput();

    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect.call(this, this.getStartDate(), this.getEndDate());
    }
  }

  public gotoDate(date: DateTime, idx = 0) {
    const toDate = new DateTime(date);
    toDate.setDate(1);
    this.calendars[idx] = toDate.clone();
    this.render();
  }

  public setLockDays(array: [any]) {
    this.options.lockDays = DateTime.convertArray(array, this.options.lockDaysFormat || '');
    this.render();
  }

  public setBookedDays(array: [any]) {
    this.options.bookedDays = DateTime.convertArray(array, this.options.bookedDaysFormat || '');
    this.render();
  }

  public setHighlightedDays(array: [any]) {
    this.options.highlightedDays = DateTime.convertArray(
      array,
      this.options.highlightedDaysFormat || '',
    );
    this.render();
  }

  public setOptions(options:CalendarOptions) {
    delete options.element;
    delete options.elementEnd;
    delete options.parentEl;

    if (options.startDate) {
      options.startDate = new DateTime(options.startDate, this.options.format, this.options.lang);
    }

    if (options.endDate) {
      options.endDate = new DateTime(options.endDate, this.options.format, this.options.lang);
    }

    this.options = { ...this.options, ...options };

    if (this.options.singleMode && !(this.options.startDate instanceof Date)) {
      this.options.startDate = undefined;
      this.options.endDate = undefined;
    }
    if (
      !this.options.singleMode &&
      (!(this.options.startDate instanceof Date) || !(this.options.endDate instanceof Date))
    ) {
      this.options.startDate = undefined;
      this.options.endDate = undefined;
    }

    for (let idx = 0; idx < (this.options.numberOfMonths || 1); idx += 1) {
      const date = this.options.startDate ? (this.options.startDate as DateTime).clone() : new DateTime();
      date.setDate(1);
      date.setMonth(date.getMonth() + idx);
      this.calendars[idx] = date;
    }

    if (this.options.lockDays?.length) {
      this.options.lockDays = DateTime.convertArray(
        this.options.lockDays,
        this.options.lockDaysFormat || '',
      );
    }

    if (this.options.bookedDays?.length) {
      this.options.bookedDays = DateTime.convertArray(
        this.options.bookedDays,
        this.options.bookedDaysFormat || '',
      );
    }

    if (this.options.highlightedDays?.length) {
      this.options.highlightedDays = DateTime.convertArray(
        this.options.highlightedDays,
        this.options.highlightedDaysFormat || '',
      );
    }

    this.render();

    if (this.options.inlineMode) {
      this.show();
    }

    this.updateInput();
  }

  public clearSelection() {
    this.options.startDate = undefined;
    this.options.endDate = undefined;
    this.datePicked.length = 0;

    this.updateInput();

    if (this.isShown()) {
      this.render();
    }
  }

  public destroy() {
    if (this.picker && this.picker.parentNode) {
      this.picker.parentNode.removeChild(this.picker);
      this.picker = null;
    }

    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
  }

  private onInit() {
    document.addEventListener('click', (e) => this.onClick(e), true);

    this.picker = document.createElement('div');
    this.picker.className = style.litepicker;
    this.picker.style.display = 'none';
    this.picker.addEventListener('keydown', (e) => this.onKeyDown(e), true);
    this.picker.addEventListener('mouseenter', (e) => this.onMouseEnter(e), true);
    this.picker.addEventListener('mouseleave', (e) => this.onMouseLeave(e), false);
    if (this.options.element instanceof HTMLElement) {
      this.options.element.addEventListener('change', (e: Event) => this.onInput(e), true);
    }
    if (this.options.elementEnd instanceof HTMLElement) {
      this.options.elementEnd.addEventListener('change', (e: Event) => this.onInput(e), true);
    }

    this.render();

    if (this.options.parentEl) {
      if (this.options.parentEl instanceof HTMLElement) {
        this.options.parentEl.appendChild(this.picker);
      } else {
        const el = document.querySelector(this.options.parentEl);
        if (el) {
          el.appendChild(this.picker);
        }
      }
    } else {
      if (this.options.inlineMode) {
        if (this.options.element instanceof HTMLInputElement) {
          if (this.options.element.parentNode) {
            this.options.element.parentNode.appendChild(this.picker);
          }
        } else {
          // @ts-ignore
          if (this.options.element) this.options.element.appendChild(this.picker);
        }
      } else {
        document.body.appendChild(this.picker);
      }
    }

    if (this.options.useResetBtn && !this.options.resetBtnCallback) {
      this.options.resetBtnCallback = this.clearSelection.bind(this);
    }

    if (this.options.mobileFriendly) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = style.litepickerBackdrop;
      this.backdrop.addEventListener('click', this.hide);
      if (this.options.element && this.options.element.parentNode) {
        this.options.element.parentNode.appendChild(this.backdrop);
      }

      window.addEventListener('orientationchange', () => {
        if (this.options.mobileFriendly && this.isShown()) {
          switch (screen.orientation.angle) {
            case -90:
            case 90:
              this.options.numberOfMonths = 2;
              this.options.numberOfColumns = 2;
              break;

            default:
              this.options.numberOfMonths = 1;
              this.options.numberOfColumns = 1;
              break;
          }

          this.render();

          if (this.picker) {
            const pickerBCR = this.picker.getBoundingClientRect();
            this.picker.style.top = `calc(50% - ${pickerBCR.height / 2}px)`;
            this.picker.style.left = `calc(50% - ${pickerBCR.width / 2}px)`;
          }
        }
      });
    }

    if (this.options.inlineMode) {
      this.show();
    }

    this.updateInput();
  }

  private parseInput() {
    if (this.options.elementEnd) {
      if (
        this.options.element instanceof HTMLInputElement &&
        this.options.element.value.length &&
        this.options.elementEnd instanceof HTMLInputElement &&
        this.options.elementEnd.value.length
      ) {
        return [
          new DateTime(this.options.element.value),
          new DateTime(this.options.elementEnd.value),
        ];
      }
    } else if (this.options.singleMode) {
      if (this.options.element instanceof HTMLInputElement && this.options.element.value.length) {
        return [new DateTime(this.options.element.value)];
      }
    } else if (/\s\-\s/.test((this.options.element as HTMLInputElement)?.value || '')) {
      const values = (this.options.element as HTMLInputElement)?.value.split(' - ');
      if (values?.length === 2) {
        return [new DateTime(values[0]), new DateTime(values[1])];
      }
    }

    return [];
  }

  private isSamePicker(el: Element) {
    const picker = el.closest(`.${style.litepicker}`);

    return picker === this.picker;
  }

  private shouldShown(el: Element) {
    return (
      el === this.options.element || (this.options.elementEnd && el === this.options.elementEnd)
    );
  }

  private shouldResetDatePicked() {
    return this.options.singleMode || this.datePicked.length === 2;
  }

  private shouldSwapDatePicked() {
    return (
      this.datePicked.length === 2 && this.datePicked[0].getTime() > this.datePicked[1].getTime()
    );
  }

  private shouldCheckLockDays() {
    return (
      this.options.disallowLockDaysInRange &&
      this.options.lockDays?.length &&
      this.datePicked.length === 2
    );
  }

  private shouldCheckBookedDays() {
    return (
      this.options.disallowBookedDaysInRange &&
      this.options.bookedDays?.length &&
      this.datePicked.length === 2
    );
  }

  private onClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    if (!target || !this.picker) {
      return;
    }

    // Click on element
    if (this.shouldShown(target)) {
      this.show(target);
      return;
    }

    // Click outside picker
    if (!target.closest(`.${style.litepicker}`)) {
      this.hide();
      return;
    }

    // Click on date
    if (target.classList.contains(style.dayItem)) {
      e.preventDefault();

      if (!this.isSamePicker(target)) {
        return;
      }

      if (target.classList.contains(style.isLocked)) {
        return;
      }

      if (target.classList.contains(style.isBooked)) {
        return;
      }

      if (this.shouldResetDatePicked()) {
        this.datePicked.length = 0;
      }

      this.datePicked[this.datePicked.length] = new DateTime(target.dataset.time);

      if (this.shouldSwapDatePicked()) {
        const tempDate = this.datePicked[1].clone();
        this.datePicked[1] = this.datePicked[0].clone();
        this.datePicked[0] = tempDate.clone();
      }

      if (this.shouldCheckLockDays()) {
        const inclusivity = this.options.lockDaysInclusivity;
        const locked = this.options.lockDays?.filter((d: any) => {
          if (d instanceof Array) {
            return (
              d[0].isBetween(this.datePicked[0], this.datePicked[1], inclusivity) ||
              d[1].isBetween(this.datePicked[0], this.datePicked[1], inclusivity)
            );
          }

          return d.isBetween(this.datePicked[0], this.datePicked[1], inclusivity);
        }).length;

        if (locked) {
          this.datePicked.length = 0;

          if (typeof this.options.onError === 'function') {
            this.options.onError.call(this, 'INVALID_RANGE');
          }
        }
      }

      if (this.shouldCheckBookedDays()) {
        let inclusivity = this.options.bookedDaysInclusivity;

        if (this.options.hotelMode && this.datePicked.length === 2) {
          inclusivity = '()';
        }

        const booked = this.options.bookedDays?.filter((d: any) => {
          if (d instanceof Array) {
            return (
              d[0].isBetween(this.datePicked[0], this.datePicked[1], inclusivity) ||
              d[1].isBetween(this.datePicked[0], this.datePicked[1], inclusivity)
            );
          }

          return d.isBetween(this.datePicked[0], this.datePicked[1]);
        }).length;

        const anyBookedDaysAsCheckout =
          this.options.anyBookedDaysAsCheckout && this.datePicked.length === 1;

        if (booked && !anyBookedDaysAsCheckout) {
          this.datePicked.length = 0;

          if (typeof this.options.onError === 'function') {
            this.options.onError.call(this, 'INVALID_RANGE');
          }
        }
      }

      this.render();

      if (this.options.autoApply) {
        if (this.options.singleMode && this.datePicked.length) {
          this.setDate(this.datePicked[0]);
          this.hide();
        } else if (!this.options.singleMode && this.datePicked.length === 2) {
          this.setDateRange(this.datePicked[0], this.datePicked[1]);
          this.hide();
        }
      }
      return;
    }

    // Click on button previous month
    if (target.classList.contains(style.buttonPreviousMonth)) {
      e.preventDefault();

      if (!this.isSamePicker(target)) {
        return;
      }

      let idx = 0;
      let numberOfMonths = this.options.numberOfMonths ?? 1;

      if (this.options.splitView) {
        const monthItem = target.closest(`.${style.monthItem}`);
        if (monthItem) {
          idx = findNestedMonthItem(monthItem);
          numberOfMonths = 1;
        }
      }

      this.calendars[idx].setMonth(this.calendars[idx].getMonth() - (numberOfMonths || 1));
      this.gotoDate(this.calendars[idx], idx);

      if (typeof this.options.onChangeMonth === 'function') {
        this.options.onChangeMonth.call(this, this.calendars[idx], idx);
      }
      return;
    }

    // Click on button next month
    if (target.classList.contains(style.buttonNextMonth)) {
      e.preventDefault();

      if (!this.isSamePicker(target)) {
        return;
      }

      let idx = 0;
      let numberOfMonths = this.options.numberOfMonths ?? 1;

      if (this.options.splitView) {
        const monthItem = target.closest(`.${style.monthItem}`);
        if (monthItem) {
          idx = findNestedMonthItem(monthItem);
          numberOfMonths = 1;
        }
      }

      this.calendars[idx].setMonth(this.calendars[idx].getMonth() + numberOfMonths);
      this.gotoDate(this.calendars[idx], idx);

      if (typeof this.options.onChangeMonth === 'function') {
        this.options.onChangeMonth.call(this, this.calendars[idx], idx);
      }
      return;
    }

    // Click on button cancel
    if (target.classList.contains(style.buttonCancel)) {
      e.preventDefault();

      if (!this.isSamePicker(target)) {
        return;
      }

      this.hide();
    }

    // Click on button apple
    if (target.classList.contains(style.buttonApply)) {
      e.preventDefault();

      if (!this.isSamePicker(target)) {
        return;
      }

      if (this.options.singleMode && this.datePicked.length) {
        this.setDate(this.datePicked[0]);
      } else if (!this.options.singleMode && this.datePicked.length === 2) {
        this.setDateRange(this.datePicked[0], this.datePicked[1]);
      }

      this.hide();
    }
  }

  private showTooltip(element: Element, text: string) {
    if (!this.picker) return;
    const tooltip = this.picker.querySelector(`.${style.containerTooltip}`) as HTMLElement;
    tooltip.style.visibility = 'visible';
    tooltip.innerHTML = text;

    const pickerBCR = this.picker.getBoundingClientRect();
    const tooltipBCR = tooltip.getBoundingClientRect();
    const dayBCR = element.getBoundingClientRect();
    let top = dayBCR.top;
    let left = dayBCR.left;

    if (this.options.inlineMode && this.options.parentEl) {
      const parentBCR = (this.picker.parentNode as HTMLElement).getBoundingClientRect();
      top -= parentBCR.top;
      left -= parentBCR.left;
    } else {
      top -= pickerBCR.top;
      left -= pickerBCR.left;
    }

    // let top = dayR.top - pickerR.top - tooltipR.height;
    // let left = (dayR.left - pickerR.left) - (tooltipR.width / 2) + (dayR.width / 2);

    top -= tooltipBCR.height;
    left -= tooltipBCR.width / 2;
    left += dayBCR.width / 2;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  private hideTooltip() {
    if (!this.picker) return;
    const tooltip = this.picker.querySelector(`.${style.containerTooltip}`) as HTMLElement;
    tooltip.style.visibility = 'hidden';
  }

  private shouldAllowMouseEnter(el: HTMLElement) {
    return (
      !this.options.singleMode &&
      !el.classList.contains(style.isLocked) &&
      !el.classList.contains(style.isBooked)
    );
  }

  private shouldAllowRepick() {
    return (
      this.options.elementEnd &&
      this.options.allowRepick &&
      this.options.startDate &&
      this.options.endDate
    );
  }

  private isDayItem(el: HTMLElement) {
    return el.classList.contains(style.dayItem);
  }

  private onMouseEnter(event: MouseEvent) {
    if (!this.picker) return;
    const target = event.target as HTMLElement;
    if (!this.isDayItem(target)) {
      return;
    }

    if (typeof this.options.onDayHover === 'function') {
      this.options.onDayHover.call(
        this,
        DateTime.parseDateTime(target.dataset.time || null),
        target.classList.value?.split(/\s/),
      );
    }

    if (this.shouldAllowMouseEnter(target)) {
      if (this.shouldAllowRepick()) {
        if (this.triggerElement === this.options.element && this.options.endDate) {
          this.datePicked[0] = this.options.endDate.clone();
        } else if (this.triggerElement === this.options.elementEnd && this.options.startDate) {
          this.datePicked[0] = this.options.startDate?.clone();
        }
      }

      if (this.datePicked.length !== 1) {
        return;
      }

      const startDateElement = this.picker.querySelector(
        `.${style.dayItem}[data-time="${this.datePicked[0].getTime()}"]`,
      );
      let date1 = this.datePicked[0].clone();
      let date2 = new DateTime(target.dataset.time);
      let isFlipped = false;

      if (date1.getTime() > date2.getTime()) {
        const tempDate = date1.clone();
        date1 = date2.clone();
        date2 = tempDate.clone();
        isFlipped = true;
      }
      const allDayItems = this.picker.querySelectorAll(`.${style.dayItem}`);
      const tmpArray: HTMLElement[] = new Array(allDayItems.length);
      for (let i = 0; i < allDayItems.length; i = i + 1) {
        const curElem = allDayItems.item(i) as HTMLElement;
        tmpArray[i] = curElem;
      }
      tmpArray.forEach((d: HTMLElement) => {
        const date = new DateTime(d.dataset.time);
        const day = this.renderDay(date);

        if (date.isBetween(date1, date2)) {
          day.classList.add(style.isInRange);
        }

        d.className = day.className;
      });

      target.classList.add(style.isEndDate);

      if (isFlipped) {
        if (startDateElement) {
          startDateElement.classList.add(style.isFlipped);
        }

        target.classList.add(style.isFlipped);
      } else {
        if (startDateElement) {
          startDateElement.classList.remove(style.isFlipped);
        }
        target.classList.remove(style.isFlipped);
      }

      if (this.options.showTooltip) {
        let days = date2.diff(date1, 'day');

        if (!this.options.hotelMode) {
          days += 1;
        }

        if (days > 0 && this.pluralSelector) {
          const pluralName = this.pluralSelector(days);
          const pluralText = (this.options.tooltipText as any)[pluralName] || `[${pluralName}]`;
          const text = `${days} ${pluralText}`;

          this.showTooltip(target, text);
        } else {
          this.hideTooltip();
        }
      }
    }
  }

  private onMouseLeave(event: MouseEvent) {
    const target = event.target as any;

    if (!this.options.allowRepick) {
      return;
    }

    this.datePicked.length = 0;
    this.render();
  }

  private onKeyDown(event: KeyboardEvent) {
    const target = event.target as any;

    switch (event.code) {
      case 'ArrowUp':
        if (target.classList.contains(style.dayItem)) {
          event.preventDefault();

          const idx = [...target.parentNode.childNodes].findIndex((el) => el === target) - 7;

          if (idx > 0 && target.parentNode.childNodes[idx]) {
            target.parentNode.childNodes[idx].focus();
          }
        }
        break;

      case 'ArrowLeft':
        if (target.classList.contains(style.dayItem) && target.previousSibling) {
          event.preventDefault();

          target.previousSibling.focus();
        }
        break;

      case 'ArrowRight':
        if (target.classList.contains(style.dayItem) && target.nextSibling) {
          event.preventDefault();

          target.nextSibling.focus();
        }
        break;

      case 'ArrowDown':
        if (target.classList.contains(style.dayItem)) {
          event.preventDefault();

          const idx = [...target.parentNode.childNodes].findIndex((el) => el === target) + 7;

          if (idx > 0 && target.parentNode.childNodes[idx]) {
            target.parentNode.childNodes[idx].focus();
          }
        }
        break;
    }
  }

  private onInput(event: Event) {
    let [startValue, endValue] = this.parseInput();

    if (
      startValue instanceof Date &&
      !isNaN(startValue.getTime()) &&
      endValue instanceof Date &&
      !isNaN(endValue.getTime())
    ) {
      if (startValue.getTime() > endValue.getTime()) {
        const tempDate = startValue.clone();
        startValue = endValue.clone();
        endValue = tempDate.clone();
      }

      this.options.startDate = new DateTime(startValue, this.options.format, this.options.lang);

      if (this.options.startDate) {
        this.options.endDate = new DateTime(endValue, this.options.format, this.options.lang);
      }

      this.updateInput();
      this.render();
    }
  }

  private loadPolyfillsForIE11(): void {
    // Support for Object.entries(...)
    // copied from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    if (!Object.entries) {
      Object.entries = (obj: any) => {
        const ownProps = Object.keys(obj);
        let i = ownProps.length;
        const resArray = new Array(i); // preallocate the Array
        while (i) {
          i = i - 1;
          resArray[i] = [ownProps[i], obj[ownProps[i]]];
        }
        return resArray;
      };
    }
    // Support for Element.closest(...)
    // copied from
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
    if (!Element.prototype.matches) {
      // tslint:disable-next-line: no-string-literal
      Element.prototype.matches =
        (Element.prototype as any)['msMatchesSelector'] || Element.prototype.webkitMatchesSelector;
    }
    if (!Element.prototype.closest) {
      Element.prototype.closest = function (s: any) {
        // tslint:disable-next-line: no-this-assignment
        let el: Element | (Node & ParentNode) | null = this;

        do {
          if ((el as Element).matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }
  }
}
