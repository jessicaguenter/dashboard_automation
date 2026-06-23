// Preserved for reference. These functions get all week start dates and quarter dates, including weeks that do not start on sunday (i.e., most Jan 1) or end on Saturday (i.e., most Dec 31).
// Gets the start and end date for a calendar quarter when the iteration is at that point
// Gets the start and end date of the year when the iteration is at the year's end.
function myFunction() {
  let [today, startDate, endDate, week] = initializeDates(
    new Date().getFullYear() - YEARS_TO_FETCH,
  );
  let currYear = startDate.getFullYear();
  const quarters = getAllQuarters(startDate, today);
  Logger.log(quarters);
  while (endDate <= today) {
    week++;
    // check for year rollover
    const yearEnd = endDate.getFullYear() > startDate.getFullYear();
    // if year rollover, set weekly report end to Dec 31.
    if (yearEnd) endDate = getYearEndDate(startDate);
    //get last week of year.
    Logger.log(
      `Week report. Start Date: ${startDate}, End Date: ${endDate}, Week: ${week}`,
    );
    // fetchDataInRange(report, headers, results, startDate, endDate, "Week", week, service, realmId);
    // week ++;
    const quarterEndDate = findIfQuarterEnd(startDate, endDate, quarters);
    // Logger.log("is Quarter end: " +quarterEndDate);
    if (quarterEndDate) {
      // Logger.log(quarterEndDate);
      const quarterStartDate = getQuarterStartDate(quarterEndDate); //quarter start date
      // const quarterEndDate = //quarter end date
      Logger.log(
        `Quarter end. Start Date: ${quarterStartDate}, End Date: ${quarterEndDate}, Week: ${week}.5`,
      );
    }
    // if end of year, get full year data and reset week.
    if (yearEnd) {
      const yearStartDate = getYearStartDate(startDate);
      Logger.log(
        `Year end. Start Date: ${yearStartDate}, End Date: ${endDate}, Week: ${week}`,
      );
      // fetchDataInRange(report, headers, results, yearStartDate, endDate, "Year", week, service, realmId);
      currYear++;
      [today, startDate, endDate, week] = initializeDates(currYear);
    } else {
      [startDate, endDate] = iterateDates(endDate);
    }
  }
}
const findIfQuarterEnd = (startDate, endDate, quarters) => {
  return quarters.find((quarter) => quarter >= startDate && quarter <= endDate); //.getTime() + (7 * 24 * 60 * 60 * 1000)
};

const getQuarterEndDate = (date) => {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const year = date.getFullYear();

  // Find which quarter we're in
  const quarter = Math.floor(month / 3) + 1;

  // Map quarter → last month of quarter
  const lastMonthOfQuarter = quarter * 3; // 3, 6, 9, 12

  // Create a new date on the *first day of the next month*, then subtract 1 day
  const quarterEnd = new Date(year, lastMonthOfQuarter, 0);
  return quarterEnd;
};

const QUARTER_ENDS = [
  [2, 31], // Mar 31
  [5, 30], // Jun 30
  [8, 30], // Sep 30
  [11, 31], // Dec 31
];
const getQuarterStartDate = (quarterEndDate) => {
  return new Date(
    quarterEndDate.getFullYear(),
    quarterEndDate.getMonth() - 2,
    1,
  );
};
const getAllQuarters = (startDate, today) => {
  let year = startDate.getFullYear();
  const quarterEndDates = [];

  while (true) {
    for (const quarterEnd of QUARTER_ENDS) {
      const quarterEndDate = new Date(year, quarterEnd[0], quarterEnd[1]);
      if (quarterEndDate > today) return quarterEndDates;
      quarterEndDates.push(quarterEndDate);
    }
    year++;
  }
};
