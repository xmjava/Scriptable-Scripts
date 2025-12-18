// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-alt;
const lunar = importModule("./module/lunar.module")

const monthCns = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
const weekCns = ["日", "一", "二", "三", "四", "五", "六"]
const foreignHolidays = [
  { day: "2.14", title: "情人节", first: false },
  { day: "5:2:0", title: "母亲节", first: true }, //5月第2个星期日
  { day: "6:3:0", title: "父亲节", first: true }, //6月第3个星期日
  { day: "10.31", title: "万圣夜", first: true },
  { day: "11:L:4", title: "感恩节", first: true }, //11月最后一个星期四
  { day: "12.24", title: "平安夜", first: true },
  { day: "12.25", title: "圣诞节", first: true }
]
let foreignHolayDayCache = {}
const dynamicBlackWhite = Color.dynamic(Color.black(), Color.white())

if (config.runsInWidget && config.widgetFamily == "large") {
  const todayDate = new Date()
  const firstDate = new Date(todayDate)
  firstDate.setDate(1)
  const currentMonthStr = monthCns[firstDate.getMonth()] + "月"
  const currentYearStr = firstDate.getFullYear().toString()
  let lunarInfo = lunar.sloarToLunar(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate())
  const currentLunarYearStr = lunarInfo.lunarYear + "年"
  let calLines = getWeeksInMonth(todayDate)

  const widget = new ListWidget()
  widget.refreshAfterDate = new Date(new Date().toLocaleDateString() + " 23:59:59")
  widget.url = "calshow://"
  widget.setPadding(18, 10, 10, 10)

  //月份和年份
  const headStack = widget.addStack()
  headStack.setPadding(0, 16, 0, 5)
  const monthStack = headStack.addStack()
  const monthLabel = monthStack.addText(currentMonthStr)
  monthLabel.textColor = Color.red()
  monthLabel.font = Font.boldSystemFont(24)

  headStack.addSpacer()

  const yearStack = headStack.addStack()
  const yearLabel = yearStack.addText(currentYearStr)
  yearLabel.textColor = dynamicBlackWhite
  yearLabel.font = Font.boldSystemFont(22)
  yearStack.addSpacer(5)
  const lunarYearStack = yearStack.addStack()
  lunarYearStack.layoutVertically()
  const lunarYearLine1Label = lunarYearStack.addText(currentLunarYearStr.substr(0, 2))
  lunarYearLine1Label.textColor = dynamicBlackWhite
  lunarYearLine1Label.font = Font.regularSystemFont(10)
  const lunarYearLine2Label = lunarYearStack.addText(currentLunarYearStr.substr(2, 2))
  lunarYearLine2Label.textColor = dynamicBlackWhite
  lunarYearLine2Label.font = Font.regularSystemFont(10)

  if (calLines == 6) {
    widget.addSpacer(5)
  } else {
    widget.addSpacer(8)
  }

  //星期标题行
  const weekStack = widget.addStack()
  weekStack.addSpacer()
  for (let i = 0; i < weekCns.length; i++) {
    const contentStack = weekStack.addStack()
    contentStack.size = new Size(40, 25)
    contentStack.addSpacer()
    const weekLabel = contentStack.addText(weekCns[i])
    weekLabel.textColor = dynamicBlackWhite
    if (i == 0 || i == 6) {
      //周末
      weekLabel.textColor = Color.red()
    }
    weekLabel.font = Font.regularSystemFont(18)
    contentStack.addSpacer()

    weekStack.addSpacer()
  }

  widget.addSpacer(3)

  const seperateStack = widget.addStack()
  seperateStack.addSpacer(16)
  const lineStack = seperateStack.addStack()
  lineStack.size = new Size(312, 1)
  lineStack.backgroundColor = Color.lightGray()
  seperateStack.addSpacer()

  widget.addSpacer(9)

  //日历内容
  let firstDateInCalendar = new Date(firstDate)
  firstDateInCalendar.setDate(firstDate.getDate() - firstDate.getDay())
  for (let i = 0; i < calLines; i++) {
    const daysStack = widget.addStack()
    daysStack.addSpacer()
    for (let j = 0; j < 7; j++) {
      let calDate = new Date(firstDateInCalendar)
      calDate.setDate(firstDateInCalendar.getDate() + i * 7 + j)
      let calendar = await Calendar.forEventsByTitle("中国大陆节假日")
      let events = await CalendarEvent.between(calDate, calDate, [calendar])
      const dayStack = daysStack.addStack()
      buildDayStack(dayStack, calDate, todayDate, events)

      daysStack.addSpacer()
    }
    if (i < calLines - 1) {
      if (calLines == 6) {
        widget.addSpacer(4)
      } else {
        widget.addSpacer(10)
      }
    }
  }

  widget.addSpacer()
  widget.backgroundColor = Color.dynamic(Color.white(), Color.black())
  Script.setWidget(widget)
  Script.complete()
}

function buildDayStack(dayStack, calDate, todayDate, events) {
  dayStack.size = new Size(40, 40)
  dayStack.layoutVertically()
  dayStack.centerAlignContent()
  let isToday = false
  if (calDate.getDate() == todayDate.getDate() && calDate.getMonth() == todayDate.getMonth()) {
    isToday = true
  }

  //公历日
  const gcDateStack = dayStack.addStack()
  gcDateStack.addSpacer()
  const gcDateLabel = gcDateStack.addText(calDate.getDate().toString())
  gcDateLabel.font = Font.boldSystemFont(18)
  gcDateStack.addSpacer()

  dayStack.addSpacer(1)

  //农历日
  let lunarInfo = lunar.sloarToLunar(calDate.getFullYear(), calDate.getMonth() + 1, calDate.getDate())
  const lcDateStack = dayStack.addStack()
  lcDateStack.addSpacer()
  const lcDateLabel = lcDateStack.addText(lunarInfo.lunarDay == "初一" ? lunarInfo.lunarMonth + "月" : lunarInfo.lunarDay)
  lcDateLabel.font = Font.regularSystemFont(10)
  lcDateStack.addSpacer()
  //节日/节气
  let eventTitle = ""
  for (event of events) {
    if (event.calendar.title == "中国大陆节假日" && event.title.indexOf("休") == -1 && event.title.indexOf("班") == -1) {
      if (event.title.indexOf("节") != -1) {
        eventTitle = event.title
        break
      } else {
        if (eventTitle.length == 0) {
          eventTitle = event.title
        }
      }
    }
  }
  //国外节日
  let foreignHolidayInfo = getForeignHoliday(calDate)
  if (foreignHolidayInfo) {
    if (eventTitle.length > 0) {
      if (foreignHolidayInfo.first) {
        eventTitle = foreignHolidayInfo.title
      }
    } else {
      eventTitle = foreignHolidayInfo.title
    }
  }
  if (eventTitle.startsWith("正月初")) {
    eventTitle = ""
  }
  if (eventTitle.length > 0) {
    lcDateLabel.text = eventTitle.substr(0, 2)
  }

  //班/休标志
  let whTag = ""
  let whColor = null
  for (event of events) {
    if (event.calendar.title == "中国大陆节假日") {
      if (event.title.indexOf("班") != -1) {
        whTag = "班"
        whColor = Color.red()
        break
      } else if (event.title.indexOf("休") != -1) {
        whTag = "休"
        whColor = new Color("#228B22")
        break
      }
    }
  }

  //绘制今日背景及班/休标志并生成背景图
  let bgImage = null
  if (isToday || whTag.length > 0) {
    let dc = new DrawContext()
    dc.respectScreenScale = true
    dc.opaque = false
    dc.size = dayStack.size
    if (isToday) {
      dc.setFillColor(Color.red())
      dc.fillEllipse(new Rect(0, 0, dc.size.width, dc.size.height))
    }
    if (whTag.length > 0) {
      dc.setTextAlignedRight()
      dc.setFont(Font.regularSystemFont(8))
      dc.setTextColor(whColor)
      dc.drawTextInRect(whTag, new Rect(0, 0, dc.size.width, dc.size.height))
    }
    bgImage = dc.getImage()
  }

  //颜色调整
  if (calDate.getMonth() == todayDate.getMonth()) {
    //本月日期
    gcDateLabel.textColor = dynamicBlackWhite
    lcDateLabel.textColor = dynamicBlackWhite
    if (calDate.getDay() == 0 || calDate.getDay() == 6) {
      //周末
      gcDateLabel.textColor = Color.red()
      lcDateLabel.textColor = Color.red()
    }
  } else {
    //非本月日期
    gcDateLabel.textColor = Color.gray()
    lcDateLabel.textColor = Color.gray()
  }
  if (isToday) {
    //今天
    // dayStack.cornerRadius = dayStack.size.width / 2
    gcDateLabel.textColor = Color.white()
    lcDateLabel.textColor = Color.white()
    // dayStack.backgroundColor = Color.red()
  }
  dayStack.backgroundImage = bgImage
}

function getForeignHoliday(calDate) {
  for (holidayInfo of foreignHolidays) {
    let day = null
    if (holidayInfo.day.indexOf(".") != -1) {
      //固定日期
      day = holidayInfo.day
    } else {
      //非固定日期
      let dayParts = holidayInfo.day.split(":")
      if (calDate.getMonth() + 1 == parseInt(dayParts[0])) {
        //先看缓存里有没有
        if (holidayInfo.day in foreignHolayDayCache) {
          //有缓存
          day = foreignHolayDayCache[holidayInfo.day]
        } else {
          //计算出准确日期
          let week = parseInt(dayParts[2])
          if ("L" == dayParts[1]) {
            //最后一个星期几
            let lastDayInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0)
            let hDate = new Date(lastDayInMonth)
            if (lastDayInMonth.getDay() >= week) {
              hDate.setDate(lastDayInMonth.getDate() - (lastDayInMonth.getDay() - week))
            } else {
              hDate.setDate(lastDayInMonth.getDate() - 7 + (week - lastDayInMonth.getDay()))
            }
            day = dayParts[0] + "." + hDate.getDate()
            //放入缓存
            foreignHolayDayCache[holidayInfo.day] = day
          } else {
            //第几个星期几
            let num = parseInt(dayParts[1])
            let firstDayInMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1)
            let hDate = new Date(firstDayInMonth)
            if (firstDayInMonth.getDay() <= week) {
              hDate.setDate(firstDayInMonth.getDate() + (week - firstDayInMonth.getDay() + 7 * (num - 1)))
            } else {
              hDate.setDate(firstDayInMonth.getDate() + 7 * num - (firstDayInMonth.getDay() - week))
            }
            day = dayParts[0] + "." + hDate.getDate()
            //放入缓存
            foreignHolayDayCache[holidayInfo.day] = day
          }
        }
      }
    }
    if (day) {
      let dayParts = day.split(".")
      if (calDate.getMonth() + 1 == parseInt(dayParts[0]) && calDate.getDate() == parseInt(dayParts[1])) {
        return holidayInfo
      }
    }
  }
  return null
}

function getWeeksInMonth(todayDate) {
  let totalDaysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate()
  let firstDate = new Date(todayDate)
  firstDate.setDate(1)
  return Math.ceil((totalDaysInMonth - (7 - firstDate.getDay())) / 7) + 1
}
