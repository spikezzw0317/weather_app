// 全局变量
const API_KEY = "eff7f5ef06b42424dfa2874014df5a71"
const BASE_URL = "https://api.openweathermap.org/data/2.5"
let currentUnit = "metric" // 默认使用摄氏度
let currentTheme = "auto" // 默认主题（根据天气自动）
let userLocation = null

// DOM 元素
const searchInput = document.querySelector(".search-input")
const searchBtn = document.querySelector(".search-btn")
const locationEl = document.querySelector(".location")
const temperatureEl = document.querySelector(".temperature")
const conditionsEl = document.querySelector(".conditions")
const weatherIconEl = document.querySelector(".weather-icon img")
const detailsEl = document.querySelector(".details")
const forecastDaysEl = document.querySelector(".forecast-days")
const hourlyContainerEl = document.querySelector(".hourly-container")
const footerEl = document.querySelector(".footer")
const themeToggleEl = document.createElement("div")
const unitToggleEl = document.createElement("div")

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  initApp()
})

// 初始化应用
function initApp() {
  // 添加事件监听器
  searchBtn.addEventListener("click", handleSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch()
  })

  // 添加主题切换按钮
  setupThemeToggle()

  // 添加温度单位切换按钮
  setupUnitToggle()

  // 添加额外信息部分
  setupExtraInfo()

  // 尝试获取用户位置
  getUserLocation()

  // 从本地存储加载用户偏好
  loadUserPreferences()
}

// 设置主题切换
function setupThemeToggle() {
  themeToggleEl.className = "theme-toggle"
  themeToggleEl.innerHTML = `
        <div class="toggle-container">
            <span>主题:</span>
            <select id="theme-select">
                <option value="auto">自动</option>
                <option value="light">日间</option>
                <option value="dark">夜间</option>
                <option value="custom">自定义</option>
            </select>
        </div>
    `

  document.querySelector(".header").appendChild(themeToggleEl)

  // 添加事件监听器
  document.getElementById("theme-select").addEventListener("change", (e) => {
    setTheme(e.target.value)
  })
}

// 设置温度单位切换
function setupUnitToggle() {
  unitToggleEl.className = "unit-toggle"
  unitToggleEl.innerHTML = `
        <div class="toggle-container">
            <span>单位:</span>
            <button id="celsius" class="active">°C</button>
            <button id="fahrenheit">°F</button>
        </div>
    `

  document.querySelector(".header").appendChild(unitToggleEl)

  // 添加事件监听器
  document.getElementById("celsius").addEventListener("click", () => changeUnit("metric"))
  document.getElementById("fahrenheit").addEventListener("click", () => changeUnit("imperial"))
}

// 设置额外信息部分
function setupExtraInfo() {
  const extraInfoSection = document.createElement("section")
  extraInfoSection.className = "extra-info"
  extraInfoSection.innerHTML = `
        <h2 class="section-title">详细信息</h2>
        <div class="extra-info-container">
            <div class="extra-info-item" id="feels-like">
                <div class="extra-info-title">体感温度</div>
                <div class="extra-info-value">--</div>
            </div>
            <div class="extra-info-item" id="sunrise-sunset">
                <div class="extra-info-title">日出/日落</div>
                <div class="extra-info-value">--/--</div>
            </div>
            <div class="extra-info-item" id="visibility">
                <div class="extra-info-title">能见度</div>
                <div class="extra-info-value">--</div>
            </div>
            <div class="extra-info-item" id="pressure">
                <div class="extra-info-title">气压</div>
                <div class="extra-info-value">--</div>
            </div>
        </div>
    `

  document.querySelector(".main-content").insertBefore(extraInfoSection, document.querySelector(".forecast"))

  // 添加自定义主题设置
  const customThemeSection = document.createElement("div")
  customThemeSection.className = "custom-theme-section"
  customThemeSection.innerHTML = `
        <div class="custom-theme-container" style="display: none;">
            <h3>自定义主题</h3>
            <div class="color-picker">
                <label>背景颜色:
                    <input type="color" id="bg-color" value="#87CEEB">
                </label>
                <label>文字颜色:
                    <input type="color" id="text-color" value="#333333">
                </label>
                <button id="save-theme">保存主题</button>
            </div>
        </div>
    `

  document.querySelector(".weather-app").appendChild(customThemeSection)

  // 添加事件监听器
  document.getElementById("save-theme").addEventListener("click", saveCustomTheme)
  document.getElementById("theme-select").addEventListener("change", (e) => {
    if (e.target.value === "custom") {
      document.querySelector(".custom-theme-container").style.display = "block"
    } else {
      document.querySelector(".custom-theme-container").style.display = "none"
    }
  })
}

// 获取用户位置
function getUserLocation() {
  if (navigator.geolocation) {
    // 显示加载动画
    showLoadingAnimation()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }

        // 获取天气数据
        getWeatherByCoords(userLocation.lat, userLocation.lon)
      },
      (error) => {
        // 定位失败，使用默认城市
        console.error("定位失败:", error)
        hideLoadingAnimation()
        getWeatherByCity("北京")
      },
    )
  } else {
    // 浏览器不支持地理定位
    console.error("您的浏览器不支持地理定位")
    getWeatherByCity("北京")
  }
}

// 处理搜索
function handleSearch() {
  const city = searchInput.value.trim()
  if (city) {
    showLoadingAnimation()
    getWeatherByCity(city)
  }
}

// 根据城市名获取天气
async function getWeatherByCity(city) {
  try {
    // 检查是否是中文城市名称，如果是则转换
    const cityName = chineseCityMap[city] || city

    // 获取当前天气
    const weatherResponse = await fetch(
      `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=${currentUnit}&lang=zh_cn`,
    )

    if (!weatherResponse.ok) {
      throw new Error("城市未找到")
    }

    const weatherData = await weatherResponse.json()

    // 获取5天/3小时预报
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=${currentUnit}&lang=zh_cn`,
    )
    const forecastData = await forecastResponse.json()

    // 更新UI
    updateWeatherUI(weatherData, forecastData)

    // 根据天气设置主题
    if (currentTheme === "auto") {
      setWeatherTheme(weatherData.weather[0].id)
    }

    // 绘制趋势图
    drawHourlyChart(forecastData)
    drawFiveDayChart(forecastData)

    // 隐藏加载动画
    hideLoadingAnimation()
  } catch (error) {
    console.error("获取天气数据失败:", error)
    showError(error.message)
    hideLoadingAnimation()
  }
}

// 根据坐标获取天气
async function getWeatherByCoords(lat, lon) {
  try {
    // 获取当前天气
    const weatherResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=zh_cn`,
    )
    const weatherData = await weatherResponse.json()

    // 获取5天/3小时预报
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=zh_cn`,
    )
    const forecastData = await forecastResponse.json()

    // 更新UI
    updateWeatherUI(weatherData, forecastData)

    // 根据天气设置主题
    if (currentTheme === "auto") {
      setWeatherTheme(weatherData.weather[0].id)
    }

    // 绘制趋势图
    drawHourlyChart(forecastData)
    drawFiveDayChart(forecastData)

    // 隐藏加载动画
    hideLoadingAnimation()
  } catch (error) {
    console.error("获取天气数据失败:", error)
    showError(error.message)
    hideLoadingAnimation()
  }
}

// 更新天气UI
function updateWeatherUI(weatherData, forecastData) {
  // 更新当前天气
  locationEl.textContent = `${weatherData.name}`

  // 使用动画更新温度
  animateTemperature(temperatureEl, Math.round(weatherData.main.temp))

  conditionsEl.textContent = weatherData.weather[0].description

  // 更新天气图标并添加动画
  const iconCode = weatherData.weather[0].icon
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`
  animateWeatherIcon(iconCode)

  // 更新详细信息
  detailsEl.innerHTML = `
        <div class="detail-item">
            <span class="label">湿度</span>
            <span class="value">${weatherData.main.humidity}%</span>
        </div>
        <div class="detail-item">
            <span class="label">风速</span>
            <span class="value">${weatherData.wind.speed} ${currentUnit === "metric" ? "m/s" : "mph"}</span>
        </div>
        <div class="detail-item">
            <span class="label">风向</span>
            <span class="value">${getWindDirection(weatherData.wind.deg)}</span>
        </div>
        <div class="detail-item">
            <span class="label">云量</span>
            <span class="value">${weatherData.clouds.all}%</span>
        </div>
    `

  // 更新未来5天预报
  updateForecast(forecastData)

  // 更新每小时预报（使用3小时预报数据）
  updateHourlyForecast(forecastData)

  // 更新额外信息
  updateExtraInfo(weatherData)

  // 更新出行建议
  updateTravelAdvice(weatherData)

  // 更新页脚
  const now = new Date()
  footerEl.innerHTML = `
        <p>数据更新时间: ${now.toLocaleString("zh-CN")}</p>
        <p>数据来源: OpenWeatherMap</p>
    `

  // 保存最后搜索的城市
  localStorage.setItem("lastCity", weatherData.name)
}

// 获取风向文字
function getWindDirection(degrees) {
  const directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"]
  return directions[Math.round(degrees / 45) % 8]
}

// 更新未来5天预报
function updateForecast(forecastData) {
  // 清空现有内容
  forecastDaysEl.innerHTML = ""

  // 按天分组数据
  const dailyData = groupForecastByDay(forecastData.list)

  // 创建每天的预报元素
  Object.entries(dailyData)
    .slice(0, 5)
    .forEach(([date, dayData]) => {
      const dateObj = new Date(date)
      const dayName = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(dateObj)

      // 计算每天的最高温和最低温
      const temps = dayData.map((item) => item.main.temp)
      const maxTemp = Math.max(...temps)
      const minTemp = Math.min(...temps)

      // 选择中午的天气图标和描述（如果有）
      const noonData =
        dayData.find((item) => {
          const hour = new Date(item.dt * 1000).getHours()
          return hour >= 11 && hour <= 13
        }) || dayData[0]

      const dayEl = document.createElement("div")
      dayEl.className = "forecast-day"
      dayEl.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="date">${dateObj.getMonth() + 1}月${dateObj.getDate()}日</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${noonData.weather[0].icon}@2x.png" alt="${noonData.weather[0].description}">
            </div>
            <div class="temps">
                <span class="high">${Math.round(maxTemp)}°</span>
                <span class="low">${Math.round(minTemp)}°</span>
            </div>
            <div class="forecast-desc">${noonData.weather[0].description}</div>
        `

      forecastDaysEl.appendChild(dayEl)
    })
}

// 按天分组预报数据
function groupForecastByDay(forecastList) {
  const groupedData = {}

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString()
    if (!groupedData[date]) {
      groupedData[date] = []
    }
    groupedData[date].push(item)
  })

  return groupedData
}

// 更新每小时预报（使用3小时预报数据）
function updateHourlyForecast(forecastData) {
  // 清空现有内容
  hourlyContainerEl.innerHTML = ""

  // 获取未来24小时的数据（最多8个数据点，每3小时一个）
  const hourlyData = forecastData.list.slice(0, 8)

  // 创建每小时的预报元素
  hourlyData.forEach((hour, index) => {
    const date = new Date(hour.dt * 1000)
    const hourText = index === 0 ? "现在" : date.getHours() + "时"

    const hourEl = document.createElement("div")
    hourEl.className = "hourly-item"
    hourEl.innerHTML = `
            <div class="time">${hourText}</div>
            <div class="icon">
                <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].description}">
            </div>
            <div class="temp">${Math.round(hour.main.temp)}°</div>
            <div class="hourly-desc">${hour.weather[0].description}</div>
        `

    hourlyContainerEl.appendChild(hourEl)
  })
}

// 绘制24小时温度趋势图
function drawHourlyChart(forecastData) {
  const canvas = document.getElementById("hourly-chart")
  if (!canvas || !canvas.getContext) return

  const ctx = canvas.getContext("2d")
  const hourlyData = forecastData.list.slice(0, 8) // 获取未来24小时的数据

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置图表尺寸和边距
  const chartWidth = canvas.width - 60
  const chartHeight = canvas.height - 40
  const marginLeft = 40
  const marginBottom = 30

  // 获取温度数据
  const temps = hourlyData.map((item) => item.main.temp)
  const maxTemp = Math.max(...temps) + 2
  const minTemp = Math.min(...temps) - 2
  const tempRange = maxTemp - minTemp

  // 绘制坐标轴
  ctx.beginPath()
  ctx.strokeStyle = "#666"
  ctx.lineWidth = 1
  ctx.moveTo(marginLeft, 10)
  ctx.lineTo(marginLeft, chartHeight + 10)
  ctx.lineTo(chartWidth + marginLeft, chartHeight + 10)
  ctx.stroke()

  // 绘制温度曲线
  ctx.beginPath()
  ctx.strokeStyle = "#ff6b6b"
  ctx.lineWidth = 2
  ctx.lineJoin = "round"

  hourlyData.forEach((hour, index) => {
    const x = marginLeft + index * (chartWidth / (hourlyData.length - 1))
    const y = 10 + chartHeight - ((hour.main.temp - minTemp) / tempRange) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    // 绘制数据点
    ctx.fillStyle = "#ff6b6b"
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // 绘制温度值
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${Math.round(hour.main.temp)}°`, x, y - 10)

    // 绘制时间标签
    const date = new Date(hour.dt * 1000)
    const hourText = index === 0 ? "现在" : `${date.getHours()}时`
    ctx.fillText(hourText, x, chartHeight + 25)
  })

  ctx.stroke()

  // 绘制Y轴温度标签
  ctx.textAlign = "right"
  ctx.fillStyle = "#666"
  for (let i = 0; i <= 4; i++) {
    const temp = minTemp + tempRange * (i / 4)
    const y = 10 + chartHeight - (i / 4) * chartHeight
    ctx.fillText(`${Math.round(temp)}°`, marginLeft - 5, y + 4)
  }
}

// 绘制5天温度趋势图
function drawFiveDayChart(forecastData) {
  const canvas = document.getElementById("five-day-chart")
  if (!canvas || !canvas.getContext) return

  const ctx = canvas.getContext("2d")

  // 按天分组数据
  const dailyData = groupForecastByDay(forecastData.list)
  const dailyEntries = Object.entries(dailyData).slice(0, 5)

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置图表尺寸和边距
  const chartWidth = canvas.width - 60
  const chartHeight = canvas.height - 40
  const marginLeft = 40
  const marginBottom = 30

  // 计算每天的最高温和最低温
  const highTemps = []
  const lowTemps = []
  const dates = []

  dailyEntries.forEach(([date, dayData]) => {
    const temps = dayData.map((item) => item.main.temp)
    highTemps.push(Math.max(...temps))
    lowTemps.push(Math.min(...temps))
    dates.push(new Date(date))
  })

  const maxTemp = Math.max(...highTemps) + 2
  const minTemp = Math.min(...lowTemps) - 2
  const tempRange = maxTemp - minTemp

  // 绘制坐标轴
  ctx.beginPath()
  ctx.strokeStyle = "#666"
  ctx.lineWidth = 1
  ctx.moveTo(marginLeft, 10)
  ctx.lineTo(marginLeft, chartHeight + 10)
  ctx.lineTo(chartWidth + marginLeft, chartHeight + 10)
  ctx.stroke()

  // 绘制最高温曲线
  ctx.beginPath()
  ctx.strokeStyle = "#ff6b6b"
  ctx.lineWidth = 2
  ctx.lineJoin = "round"

  highTemps.forEach((temp, index) => {
    const x = marginLeft + index * (chartWidth / (dailyEntries.length - 1))
    const y = 10 + chartHeight - ((temp - minTemp) / tempRange) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    // 绘制数据点
    ctx.fillStyle = "#ff6b6b"
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // 绘制温度值
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${Math.round(temp)}°`, x, y - 10)
  })

  ctx.stroke()

  // 绘制最低温曲线
  ctx.beginPath()
  ctx.strokeStyle = "#74b9ff"
  ctx.lineWidth = 2
  ctx.lineJoin = "round"

  lowTemps.forEach((temp, index) => {
    const x = marginLeft + index * (chartWidth / (dailyEntries.length - 1))
    const y = 10 + chartHeight - ((temp - minTemp) / tempRange) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    // 绘制数据点
    ctx.fillStyle = "#74b9ff"
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // 绘制温度值
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${Math.round(temp)}°`, x, y + 20)
  })

  ctx.stroke()

  // 绘制日期标签
  ctx.fillStyle = "#666"
  ctx.textAlign = "center"
  dailyEntries.forEach(([date, _], index) => {
    const x = marginLeft + index * (chartWidth / (dailyEntries.length - 1))
    const dateObj = new Date(date)
    const dayName = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(dateObj)
    const dateText = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
    ctx.fillText(`${dayName} ${dateText}`, x, chartHeight + 25)
  })

  // 绘制Y轴温度标签
  ctx.textAlign = "right"
  ctx.fillStyle = "#666"
  for (let i = 0; i <= 4; i++) {
    const temp = minTemp + tempRange * (i / 4)
    const y = 10 + chartHeight - (i / 4) * chartHeight
    ctx.fillText(`${Math.round(temp)}°`, marginLeft - 5, y + 4)
  }

  // 添加图例
  ctx.textAlign = "left"
  ctx.fillStyle = "#ff6b6b"
  ctx.fillRect(marginLeft, chartHeight + 40, 15, 2)
  ctx.fillText("最高温", marginLeft + 20, chartHeight + 42)

  ctx.fillStyle = "#74b9ff"
  ctx.fillRect(marginLeft + 80, chartHeight + 40, 15, 2)
  ctx.fillText("最低温", marginLeft + 100, chartHeight + 42)
}

// 添加中文城市名称映射
/*const chineseCityMap = {
  北京: "Beijing",
  上海: "Shanghai",
  广州: "Guangzhou",
  深圳: "Shenzhen",
  成都: "Chengdu",
  杭州: "Hangzhou",
  武汉: "Wuhan",
  西安: "Xi'an",
  南京: "Nanjing",
  重庆: "Chongqing",
  天津: "Tianjin",
  苏州: "Suzhou",
  郑州: "Zhengzhou",
  长沙: "Changsha",
  青岛: "Qingdao",
  大连: "Dalian",
  宁波: "Ningbo",
  厦门: "Xiamen",
  福州: "Fuzhou",
  哈尔滨: "Harbin",
  济南: "Jinan",
  沈阳: "Shenyang",
  太原: "Taiyuan",
  昆明: "Kunming",
  贵阳: "Guiyang",
  南宁: "Nanning",
  合肥: "Hefei",
  长春: "Changchun",
  石家庄: "Shijiazhuang",
  兰州: "Lanzhou",
  西宁: "Xining",
  银川: "Yinchuan",
  乌鲁木齐: "Urumqi",
  拉萨: "Lhasa",
  海口: "Haikou",
  三亚: "Sanya",
}*/

const chineseCityMap = {
  北京: "Beijing",
  上海: "Shanghai",
  广州: "Guangzhou",
  深圳: "Shenzhen",
  成都: "Chengdu",
  杭州: "Hangzhou",
  武汉: "Wuhan",
  西安: "Xi'an",
  南京: "Nanjing",
  重庆: "Chongqing",
  天津: "Tianjin",
  苏州: "Suzhou",
  郑州: "Zhengzhou",
  长沙: "Changsha",
  青岛: "Qingdao",
  大连: "Dalian",
  宁波: "Ningbo",
  厦门: "Xiamen",
  福州: "Fuzhou",
  哈尔滨: "Harbin",
  济南: "Jinan",
  沈阳: "Shenyang",
  太原: "Taiyuan",
  昆明: "Kunming",
  贵阳: "Guiyang",
  南宁: "Nanning",
  合肥: "Hefei",
  长春: "Changchun",
  石家庄: "Shijiazhuang",
  兰州: "Lanzhou",
  西宁: "Xining",
  银川: "Yinchuan",
  乌鲁木齐: "Urumqi",
  拉萨: "Lhasa",
  海口: "Haikou",
  三亚: "Sanya",

  // 华东地区
  南昌: "Nanchang",
  南通: "Nantong",
  扬州: "Yangzhou",
  常州: "Changzhou",
  徐州: "Xuzhou",
  连云港: "Lianyungang",
  盐城: "Yancheng",
  泰州: "Taizhou",
  宿迁: "Suqian",
  淮安: "Huai'an",
  无锡: "Wuxi",
  嘉兴: "Jiaxing",
  湖州: "Huzhou",
  绍兴: "Shaoxing",
  金华: "Jinhua",
  衢州: "Quzhou",
  舟山: "Zhoushan",
  台州: "Taizhou",
  丽水: "Lishui",
  马鞍山: "Ma'anshan",
  芜湖: "Wuhu",
  宣城: "Xuancheng",
  黄山: "Huangshan",
  滁州: "Chuzhou",
  阜阳: "Fuyang",
  宿州: "Suzhou",
  淮北: "Huaibei",
  亳州: "Bozhou",
  池州: "Chizhou",
  铜陵: "Tongling",
  安庆: "Anqing",
  六安: "Lu'an",
  巢湖: "Chaohu",
  滁州: "Chuzhou",
  合肥: "Hefei",
  阜阳: "Fuyang",
  亳州: "Bozhou",
  滁州: "Chuzhou",
  宣城: "Xuancheng",
  池州: "Chizhou",
  铜陵: "Tongling",
  安庆: "Anqing",
  六安: "Lu'an",
  巢湖: "Chaohu",
  马鞍山: "Ma'anshan",
  芜湖: "Wuhu",
  黄山: "Huangshan",

  // 华北地区
  唐山: "Tangshan",
  秦皇岛: "Qinhuangdao",
  邯郸: "Handan",
  邢台: "Xingtai",
  保定: "Baoding",
  张家口: "Zhangjiakou",
  承德: "Chengde",
  沧州: "Cangzhou",
  廊坊: "Langfang",
  衡水: "Hengshui",
  大同: "Datong",
  忻州: "Xinzhou",
  吕梁: "Lüliang",
  晋中: "Jinzhong",
  临汾: "Linfen",
  运城: "Yuncheng",
  阳泉: "Yangquan",
  长治: "Changzhi",
  晋城: "Jincheng",

  // 华南地区
  珠海: "Zhuhai",
  汕头: "Shantou",
  佛山: "Foshan",
  惠州: "Huizhou",
  东莞: "Dongguan",
  中山: "Zhongshan",
  江门: "Jiangmen",
  茂名: "Maoming",
  湛江: "Zhanjiang",
  梅州: "Meizhou",
  汕尾: "Shanwei",
  河源: "Heyuan",
  阳江: "Yangjiang",
  清远: "Qingyuan",
  云浮: "Yunfu",
  揭阳: "Jieyang",
  潮州: "Chaozhou",
  汕头: "Shantou",
  湛江: "Zhanjiang",
  茂名: "Maoming",
  江门: "Jiangmen",
  阳江: "Yangjiang",
  梅州: "Meizhou",
  汕尾: "Shanwei",
  河源: "Heyuan",
  清远: "Qingyuan",
  云浮: "Yunfu",
  揭阳: "Jieyang",
  潮州: "Chaozhou",
  韶关: "Shaoguan",
  肇庆: "Zhaoqing",
  中山: "Zhongshan",
  惠州: "Huizhou",
  佛山: "Foshan",
  东莞: "Dongguan",
  珠海: "Zhuhai",
  汕头: "Shantou",
  湛江: "Zhanjiang",
  茂名: "Maoming",
  江门: "Jiangmen",
  阳江: "Yangjiang",
  梅州: "Meizhou",
  汕尾: "Shanwei",
  河源: "Heyuan",
  清远: "Qingyuan",
  云浮: "Yunfu",
  揭阳: "Jieyang",
  潮州: "Chaozhou",
  韶关: "Shaoguan",
  肇庆: "Zhaoqing",
  中山: "Zhongshan",
  惠州: "Huizhou",
  佛山: "Foshan",
  东莞: "Dongguan",
  珠海: "Zhuhai",

  // 西南地区
  攀枝花: "Panzhihua",
  泸州: "Luzhou",
  德阳: "Deyang",
  绵阳: "Mianyang",
  广元: "Guangyuan",
  遂宁: "Suining",
  内江: "Neijiang",
  乐山: "Leshan",
  南充: "Nanchong",
  眉山: "Meishan",
  宜宾: "Yibin",
  广安: "Guangan",
  达州: "Dazhou",
  雅安: "Ya'an",
  巴中: "Bazhong",
  资阳: "Ziyang",
  自贡: "Zigong",
  凉山: "Liangshan",
  甘孜: "Ganzi",
  阿坝: "Aba",
  昭通: "Zhaotong",
  曲靖: "Qujing",
  玉溪: "Yuxi",
  保山: "Baoshan",
  昭通: "Zhaotong",
  丽江: "Lijiang",
  思茅: "Simao",
  临沧: "Lincang",
  楚雄: "Chuxiong",
  红河: "Honghe",
  文山: "Wenshan",
  西双版纳: "Xishuangbanna",
  大理: "Dali",
  德宏: "Dehong",
  怒江: "Nujiang",
  迪庆: "Diqing",

  // 西北地区
  天水: "Tianshui",
  平凉: "Pingliang",
  庆阳: "Qingyang",
  定西: "Dingxi",
  陇南: "Longnan",
  临夏: "Linxia",
  甘南: "Gannan",
  海东: "Haidong",
  海北: "Haibei",
  黄南: "Huangnan",
  海南: "Hainan",
  果洛: "Golog",
  玉树: "Yushu",
  海西: "Haixi",
  吐鲁番: "Turpan",
  哈密: "Hami",
  和田: "Hotan",
  阿克苏: "Aksu",
  喀什: "Kashgar",
  克拉玛依: "Karamay",
  博尔塔拉: "Bortala",
  昌吉: "Changji",
  巴音郭楞: "Bayingol",
  阿勒泰: "Altay",
  塔城: "Tacheng",
  克孜勒苏: "Kizilsu",
  山南: "Shannan",
  日喀则: "Rikaze",
  那曲: "Naqu",
  阿里: "Ali",
  林芝: "Nyingchi",
  昌都: "Qamdo",
};

// 更新额外信息
function updateExtraInfo(weatherData) {
  // 体感温度
  document.querySelector("#feels-like .extra-info-value").textContent =
    `${Math.round(weatherData.main.feels_like)}°${currentUnit === "metric" ? "C" : "F"}`

  // 日出日落
  const sunrise = new Date(weatherData.sys.sunrise * 1000)
  const sunset = new Date(weatherData.sys.sunset * 1000)
  document.querySelector("#sunrise-sunset .extra-info-value").textContent =
    `${sunrise.getHours()}:${String(sunrise.getMinutes()).padStart(2, "0")} / ${sunset.getHours()}:${String(sunset.getMinutes()).padStart(2, "0")}`

  // 能见度
  const visibilityKm = (weatherData.visibility / 1000).toFixed(1)
  document.querySelector("#visibility .extra-info-value").textContent = `${visibilityKm} km`

  // 气压
  document.querySelector("#pressure .extra-info-value").textContent = `${weatherData.main.pressure} hPa`
}

// 更新出行建议
function updateTravelAdvice(weatherData) {
  const weatherId = weatherData.weather[0].id
  const weatherMain = weatherData.weather[0].main
  const temp = weatherData.main.temp
  const windSpeed = weatherData.wind.speed
  const humidity = weatherData.main.humidity
  const clouds = weatherData.clouds.all
  const rain = weatherData.rain ? weatherData.rain["1h"] || 0 : 0
  const uvIndex = getEstimatedUVIndex(weatherId, clouds)

  // 雨伞建议
  const umbrellaEl = document.querySelector("#umbrella-advice .advice-text")
  if (weatherId >= 200 && weatherId < 700) {
    umbrellaEl.textContent = "建议带伞"
    umbrellaEl.parentElement.style.backgroundColor = "rgba(116, 185, 255, 0.3)"
  } else if (weatherId >= 800 && clouds > 60) {
    umbrellaEl.textContent = "可能需要带伞"
    umbrellaEl.parentElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  } else {
    umbrellaEl.textContent = "无需带伞"
    umbrellaEl.parentElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  }

  // 防晒建议
  const sunEl = document.querySelector("#sun-advice .advice-text")
  if (uvIndex >= 8) {
    sunEl.textContent = "极强烈防晒"
    sunEl.parentElement.style.backgroundColor = "rgba(255, 107, 107, 0.3)"
  } else if (uvIndex >= 6) {
    sunEl.textContent = "强烈防晒"
    sunEl.parentElement.style.backgroundColor = "rgba(255, 159, 67, 0.3)"
  } else if (uvIndex >= 3) {
    sunEl.textContent = "需要防晒"
    sunEl.parentElement.style.backgroundColor = "rgba(255, 205, 86, 0.3)"
  } else {
    sunEl.textContent = "无需防晒"
    sunEl.parentElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  }

  // 口罩建议
  const maskEl = document.querySelector("#mask-advice .advice-text")
  if (weatherId >= 700 && weatherId < 800) {
    maskEl.textContent = "建议戴口罩"
    maskEl.parentElement.style.backgroundColor = "rgba(255, 159, 67, 0.3)"
  } else if (weatherId === 781 || windSpeed > 10) {
    maskEl.textContent = "建议戴口罩"
    maskEl.parentElement.style.backgroundColor = "rgba(255, 159, 67, 0.3)"
  } else {
    maskEl.textContent = "无需戴口罩"
    maskEl.parentElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  }

  // 穿衣建议
  const clothingEl = document.querySelector("#clothing-advice .advice-text")
  if (currentUnit === "metric") {
    // 摄氏度
    if (temp >= 30) {
      clothingEl.textContent = "单薄夏装"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 107, 107, 0.3)"
    } else if (temp >= 25) {
      clothingEl.textContent = "夏季服装"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 159, 67, 0.3)"
    } else if (temp >= 20) {
      clothingEl.textContent = "薄长袖"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 205, 86, 0.3)"
    } else if (temp >= 15) {
      clothingEl.textContent = "长袖外套"
      clothingEl.parentElement.style.backgroundColor = "rgba(120, 224, 143, 0.3)"
    } else if (temp >= 10) {
      clothingEl.textContent = "薄夹克"
      clothingEl.parentElement.style.backgroundColor = "rgba(116, 185, 255, 0.3)"
    } else if (temp >= 5) {
      clothingEl.textContent = "厚外套"
      clothingEl.parentElement.style.backgroundColor = "rgba(162, 155, 254, 0.3)"
    } else {
      clothingEl.textContent = "棉衣羽绒服"
      clothingEl.parentElement.style.backgroundColor = "rgba(108, 92, 231, 0.3)"
    }
  } else {
    // 华氏度
    if (temp >= 86) {
      clothingEl.textContent = "单薄夏装"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 107, 107, 0.3)"
    } else if (temp >= 77) {
      clothingEl.textContent = "夏季服装"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 159, 67, 0.3)"
    } else if (temp >= 68) {
      clothingEl.textContent = "薄长袖"
      clothingEl.parentElement.style.backgroundColor = "rgba(255, 205, 86, 0.3)"
    } else if (temp >= 59) {
      clothingEl.textContent = "长袖外套"
      clothingEl.parentElement.style.backgroundColor = "rgba(120, 224, 143, 0.3)"
    } else if (temp >= 50) {
      clothingEl.textContent = "薄夹克"
      clothingEl.parentElement.style.backgroundColor = "rgba(116, 185, 255, 0.3)"
    } else if (temp >= 41) {
      clothingEl.textContent = "厚外套"
      clothingEl.parentElement.style.backgroundColor = "rgba(162, 155, 254, 0.3)"
    } else {
      clothingEl.textContent = "棉衣羽绒服"
      clothingEl.parentElement.style.backgroundColor = "rgba(108, 92, 231, 0.3)"
    }
  }
}

// 根据天气状况估算紫外线指数
function getEstimatedUVIndex(weatherId, clouds) {
  // 基础UV指数 (晴天为8)
  let baseUV = 8

  // 根据云量调整
  const cloudFactor = 1 - (clouds / 100) * 0.8

  // 根据天气状况调整
  if (weatherId >= 200 && weatherId < 300) {
    // 雷雨
    baseUV *= 0.3
  } else if (weatherId >= 300 && weatherId < 400) {
    // 毛毛雨
    baseUV *= 0.4
  } else if (weatherId >= 500 && weatherId < 600) {
    // 雨
    baseUV *= 0.3
  } else if (weatherId >= 600 && weatherId < 700) {
    // 雪
    baseUV *= 0.5
  } else if (weatherId >= 700 && weatherId < 800) {
    // 雾霾等
    baseUV *= 0.6
  } else if (weatherId === 800) {
    // 晴天
    baseUV *= 1
  } else if (weatherId > 800) {
    // 多云
    baseUV *= cloudFactor
  }

  return Math.round(baseUV)
}

// 显示加载动画
function showLoadingAnimation() {
  // 创建加载动画元素
  if (!document.querySelector(".loading-animation")) {
    const loadingEl = document.createElement("div")
    loadingEl.className = "loading-animation"
    loadingEl.innerHTML = `
            <div class="spinner"></div>
            <p>正在加载天气数据...</p>
        `
    document.querySelector(".weather-app").appendChild(loadingEl)
  }
}

// 隐藏加载动画
function hideLoadingAnimation() {
  const loadingEl = document.querySelector(".loading-animation")
  if (loadingEl) {
    loadingEl.classList.add("fade-out")
    setTimeout(() => {
      loadingEl.remove()
    }, 500)
  }
}

// 显示错误信息
function showError(message) {
  const errorEl = document.createElement("div")
  errorEl.className = "error-message"
  errorEl.textContent = `错误: ${message}`

  document.querySelector(".weather-app").appendChild(errorEl)

  setTimeout(() => {
    errorEl.classList.add("fade-out")
    setTimeout(() => {
      errorEl.remove()
    }, 500)
  }, 3000)
}

// 温度动画
function animateTemperature(element, newTemp) {
  const currentTemp = Number.parseInt(element.textContent) || 0
  const diff = newTemp - currentTemp
  const steps = 20
  const increment = diff / steps
  let current = currentTemp
  let step = 0

  const interval = setInterval(() => {
    current += increment
    step++

    if (step >= steps) {
      current = newTemp
      clearInterval(interval)
    }

    element.textContent = `${Math.round(current)}${currentUnit === "metric" ? "°C" : "°F"}`
  }, 20)
}

// 天气图标动画
function animateWeatherIcon(iconCode) {
  weatherIconEl.classList.add("icon-animation")

  // 根据天气类型添加特定动画
  if (iconCode.includes("01")) {
    // 晴天
    weatherIconEl.classList.add("sunny-animation")
  } else if (iconCode.includes("02") || iconCode.includes("03") || iconCode.includes("04")) {
    // 多云
    weatherIconEl.classList.add("cloudy-animation")
  } else if (iconCode.includes("09") || iconCode.includes("10")) {
    // 雨
    weatherIconEl.classList.add("rainy-animation")
  } else if (iconCode.includes("11")) {
    // 雷雨
    weatherIconEl.classList.add("thunder-animation")
  } else if (iconCode.includes("13")) {
    // 雪
    weatherIconEl.classList.add("snow-animation")
  } else if (iconCode.includes("50")) {
    // 雾
    weatherIconEl.classList.add("fog-animation")
  }

  setTimeout(() => {
    weatherIconEl.classList.remove(
      "icon-animation",
      "sunny-animation",
      "cloudy-animation",
      "rainy-animation",
      "thunder-animation",
      "snow-animation",
      "fog-animation",
    )
  }, 2000)
}

// 切换温度单位
function changeUnit(unit) {
  if (unit === currentUnit) return

  currentUnit = unit

  // 更新按钮状态
  document.getElementById("celsius").classList.toggle("active", unit === "metric")
  document.getElementById("fahrenheit").classList.toggle("active", unit === "imperial")

  // 保存用户偏好
  localStorage.setItem("unit", unit)

  // 重新获取天气数据
  if (userLocation) {
    showLoadingAnimation()
    getWeatherByCoords(userLocation.lat, userLocation.lon)
  } else {
    const lastCity = localStorage.getItem("lastCity") || "北京"
    showLoadingAnimation()
    getWeatherByCity(lastCity)
  }
}

// 设置主题
function setTheme(theme) {
  currentTheme = theme

  // 移除所有主题类
  document.body.classList.remove(
    "theme-light",
    "theme-dark",
    "theme-custom",
    "theme-rainy",
    "theme-cloudy",
    "theme-sunny",
    "theme-snowy",
    "theme-foggy",
    "theme-thunderstorm",
  )

  // 应用选择的主题
  switch (theme) {
    case "light":
      document.body.classList.add("theme-light")
      break
    case "dark":
      document.body.classList.add("theme-dark")
      break
    case "custom":
      document.body.classList.add("theme-custom")
      applyCustomTheme()
      break
    // 'auto' 主题将根据天气状况自动设置
  }

  // 保存用户偏好
  localStorage.setItem("theme", theme)
}

// 根据天气设置主题
function setWeatherTheme(weatherCode) {
  // 移除所有天气主题类
  document.body.classList.remove(
    "theme-rainy",
    "theme-cloudy",
    "theme-sunny",
    "theme-snowy",
    "theme-foggy",
    "theme-thunderstorm",
  )

  // 根据天气代码设置主题
  if (weatherCode >= 200 && weatherCode < 300) {
    // 雷雨
    document.body.classList.add("theme-thunderstorm")
  } else if ((weatherCode >= 300 && weatherCode < 400) || (weatherCode >= 500 && weatherCode < 600)) {
    // 雨
    document.body.classList.add("theme-rainy")
  } else if (weatherCode >= 600 && weatherCode < 700) {
    // 雪
    document.body.classList.add("theme-snowy")
  } else if (weatherCode >= 700 && weatherCode < 800) {
    // 雾
    document.body.classList.add("theme-foggy")
  } else if (weatherCode === 800) {
    // 晴
    document.body.classList.add("theme-sunny")
  } else if (weatherCode > 800) {
    // 多云
    document.body.classList.add("theme-cloudy")
  }
}

// 保存自定义主题
function saveCustomTheme() {
  const bgColor = document.getElementById("bg-color").value
  const textColor = document.getElementById("text-color").value

  // 保存到本地存储
  localStorage.setItem("customTheme", JSON.stringify({ bgColor, textColor }))

  // 应用主题
  applyCustomTheme()

  // 显示确认消息
  alert("自定义主题已保存")
}

// 应用自定义主题
function applyCustomTheme() {
  const customTheme = JSON.parse(localStorage.getItem("customTheme")) || { bgColor: "#87CEEB", textColor: "#333333" }

  document.documentElement.style.setProperty("--custom-bg-color", customTheme.bgColor)
  document.documentElement.style.setProperty("--custom-text-color", customTheme.textColor)
}

// 从本地存储加载用户偏好
function loadUserPreferences() {
  // 加载主题
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme) {
    document.getElementById("theme-select").value = savedTheme
    setTheme(savedTheme)
  }

  // 加载温度单位
  const savedUnit = localStorage.getItem("unit")
  if (savedUnit) {
    currentUnit = savedUnit
    document.getElementById("celsius").classList.toggle("active", savedUnit === "metric")
    document.getElementById("fahrenheit").classList.toggle("active", savedUnit === "imperial")
  }

  // 加载自定义主题
  if (localStorage.getItem("customTheme")) {
    applyCustomTheme()
  }

  // 加载最后搜索的城市
  const lastCity = localStorage.getItem("lastCity")
  if (lastCity && !userLocation) {
    getWeatherByCity(lastCity)
  }
}

let chatHistory = [];

// ✅ 提取：生成 system prompt
function buildSystemPrompt(weatherInfo) {
  return `你是一个中文出行天气顾问。我在${weatherInfo.city}，当前${weatherInfo.condition}，气温${weatherInfo.temp}，风速${weatherInfo.wind}，湿度${weatherInfo.humidity}。
接下来我会告诉你我的日程，请用不超过100字结合天气给出建议，要口语化、简洁、有提醒性。`;
}

// ✅ 获取用户经纬度（可自定义）
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("定位失败，默认北京", err);
        resolve({ lat: 39.9042, lon: 116.4074 }); // 默认北京
      }
    );
  });
}

// ✅ 获取天气信息
async function getWeatherByCoords(lat, lon) {
  const apiKey = "eff7f5ef06b42424dfa2874014df5a71";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  return {
    city: data.name,
    temp: `${Math.round(data.main.temp)}℃`,
    condition: data.weather[0].description,
    wind: `${data.wind.speed}m/s`,
    humidity: `${data.main.humidity}%`,
  };
}

// ✅ 页面加载入口：获取天气 + 初始化对话
document.addEventListener("DOMContentLoaded", async () => {
  const { lat, lon } = await getUserLocation();
  const weatherInfo = await getWeatherByCoords(lat, lon);
  const sysPrompt = buildSystemPrompt(weatherInfo);

  chatHistory = [
    { role: "system", content: sysPrompt },
    { role: "assistant", content: "你好！请告诉我你的出行安排，我会结合天气给建议 😊" }
  ];

  setupChatWindow();
  openChat();
});

// ✅ 打开聊天窗口
function openChat() {
  document.getElementById("chatModal").style.display = "flex";
  if (chatHistory.length === 2) {
    appendChat("bot", chatHistory[1].content);
  }
}

// ✅ 设置聊天窗口交互逻辑
function setupChatWindow() {
  const openBtn = document.getElementById("openChatBtn");
  const closeBtn = document.getElementById("closeChatBtn");
  const sendBtn = document.getElementById("sendChatBtn");
  const inputEl = document.getElementById("chatInput");

  openBtn.onclick = openChat;
  closeBtn.onclick = closeChat;

  sendBtn.onclick = () => {
    const msg = inputEl.value.trim();
    if (msg) {
      appendChat("user", msg);
      inputEl.value = "";
      chatHistory.push({ role: "user", content: msg });
      getChatReply();
    }
  };

  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
}

function closeChat() {
  document.getElementById("chatModal").style.display = "none";
}

function appendChat(sender, text) {
  const container = document.getElementById("chatContent");
  const msgEl = document.createElement("div");
  msgEl.className = `chat-message ${sender}`;
  msgEl.textContent = text;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

async function getChatReply() {
  appendChat("bot", "正在生成建议，请稍候...");
  try {
    const reply = await sendToDeepSeek(chatHistory);
    // 移除 loading 提示
    const botLoading = document.querySelector(".chat-message.bot:last-child");
    if (botLoading && botLoading.textContent.includes("正在生成")) {
      botLoading.remove();
    }
    appendChat("bot", reply);
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    appendChat("bot", "出错了，请稍后再试 🙁");
    console.error("DeepSeek 请求失败：", err);
  }
}

async function sendToDeepSeek(history) {
  const res = await fetch("http://43.139.219.125:3000/api/deepseek", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: history,
      stream: false
    }),
  });

  const data = await res.json();
  if (!data || !data.choices || !data.choices[0]) {
    console.error("🧨 DeepSeek 返回内容异常：", data);
    throw new Error("DeepSeek 返回数据格式异常");
  }

  return data.choices[0].message.content;
}



