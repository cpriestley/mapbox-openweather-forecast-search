"use strict";
import {weather} from "./weather.js";

$(function () {

    let storedForecast;

    //Initial forecast for San Antonio, TX
    refreshWeatherForecast('San Antonio, TX');

    function getProps(latitude, longitude) {
        return weather.props({latitude, longitude});
    }

    $("div[id^='day-']").click(function (e) {
        let idx = $(e.currentTarget).attr('db-id');
        let key = Object.keys(storedForecast)[idx];
        updateHourDetail(storedForecast[key]);
    });

    $("#search").click(function () {
        refreshWeatherForecast($("#city-name").val());
    });

    $("#btn-refresh").click(function () {
        refreshWeatherForecast($("#city-name").val());
    });

    $('#btn-refresh, #btn-modal').hover(
        function(){ $(this).addClass('fa-spin') },
        function(){ $(this).removeClass('fa-spin') }
    )

    function refreshWeatherForecast(cityName) {
        geocode(cityName, mapboxgl.accessToken)
            .then((coordinates) => {
                mapbox.flyToLocation(coordinates);
                return getProps(coordinates[1], coordinates[0]);
            })
            .then((props) => {
                return weather.fetchCurrentWeather(props);
            }, (error) => {
                console.log(error);
            })
            .then((current) => {
                updateCurrentWeather(current);
                //weather.weather[0].icon
                return weather.fetchWeatherForecast(weather.getProps());
            })
            .then((forecast) => {
                storedForecast = reduceForecast(forecast);
                updateForecast(storedForecast);
                $("#last-refresh").text("As of " + new Date().toLocaleTimeString());
            }, (error) => {
                console.log(error);
            });
    }

    /**
     * @param current
     * @param current.clouds
     * @param current.main
     * @param current.main.feels_like
     * @param current.main.humidity
     * @param current.main.temp
     * @param current.weather
     * @param current.wind.speed
     */
    function updateCurrentWeather(current) {
        $("#location").text(current['name']);
        $("#temp").text(current.main.temp + ' ' + String.fromCharCode(176));
        $("#main").text(current.weather[0]['main'])
        $("#description").text(current.weather[0].description);
        $("#feels-like").text('Feels like ' + current.main.feels_like + ' ' + String.fromCharCode(176));
        $("#cloudiness").text(current.clouds.all + '%');
        $("#humidity").text(current.main.humidity);
        $("#wind").text(current.wind.speed + ' mph');
    }

    function updateForecast(forecast) {
        let firstKey = Object.keys(forecast)[0];

        for (let i = 0; i < 5; i++) {
            let key = Object.keys(forecast)[i];
            let day = key.split(' ')[0].substring(0, 3).toUpperCase();
            $(`#day-${i + 1} > div:nth-child(1)`).text(day);
            let icon = mostCommon(forecast[key].map((hr) => hr.icon));
            $(`#day-${i + 1} > div:nth-child(2) > img`).attr("src", "/media/" + icon + "@4x.png");
            let high = forecast[key].map(hr => hr.max).sort().reverse()[0];
            $(`#day-${i + 1} > div:nth-child(3)`).text(high + ' ' + String.fromCharCode(176));
            let low = forecast[key].map(hr => hr.min).sort()[0];
            $(`#day-${i + 1} > div:nth-child(4)`).text(low + ' ' + String.fromCharCode(176));
        }
        updateHourDetail(forecast[firstKey])
    }

    function updateHourDetail(data) {
        let date = data[0].date;
        let partial = date.substring(0,3);
        let weekday = convertPartial(partial);
        let displayDate = date.replace(partial, weekday);
        weekdayDateDisplay.text(displayDate);
        for (let i = 0; i < data.length; i++) {
            $(`#hr-${i + 1}-detail > div:nth-child(1)`).text(data[i].time);
            $(`#hr-${i + 1}-detail > div:nth-child(2) > img`).attr('src', "/media/" + data[i].icon + "@4x.png");
            $(`#hr-${i + 1}-detail > div:nth-child(3)`).text(data[i].max + ' ' + String.fromCharCode(176));
            $(`#hr-${i + 1}-detail > div:nth-child(4)`).text(data[i].min + ' ' + String.fromCharCode(176));
            $(`#hr-${i + 1}-detail > div:nth-child(5)`).text(data[i].wind + ' mph');
            $(`#hr-${i + 1}-detail`).removeClass('d-none');
        }
        for (let i = data.length; i < 8; i++) {
            $(`#hr-${i + 1}-detail`).addClass('d-none');
        }
    }

    function mostCommon(list) {
        let keyCounts = {};
        let topCount = 0;
        let topKey = {};
        list.forEach(function (item) {
            keyCounts[item] = keyCounts[item] + 1 || 1;
            if (keyCounts[item] > topCount) {
                topKey = item;
                topCount = keyCounts[item];
            }
        });

        return topKey;
    }

    function convertUTC(date) {
        return new Date(date * 1000);
    }

    function reduceForecast(forecast) {
        return forecast.list.map((hr) => {
            let date = convertUTC(hr['dt']).toDateString().split(' ');
            date = date[0] + ', ' + month(date) + ' ' + date[2];
            let time = convertUTC(hr['dt']).toLocaleTimeString();
            time = time.split(':')[0] + time.split(' ')[1]
            let icon = hr.weather[0]['icon'];
            let max = hr.main['temp_max'];
            let min = hr.main['temp_min'];
            let wind = hr.wind['speed'];
            return {date, time, icon, max, min, wind};
        })
            .reduce((acc, curr) => {
                acc[curr.date] = acc[curr.date] || [];
                acc[curr.date].push(curr);
                return acc;
            }, {});
    }

    function convertPartial(partial) {
        switch (partial) {
            case 'Mon':
                return 'Monday';
            case 'Tue':
                return 'Tuesday';
            case 'Wed':
                return 'Wednesday';
            case 'Thu':
                return 'Thursday';
            case 'Fri':
                return 'Friday';
            case 'Sat':
                return 'Saturday';
            case 'Sun':
                return 'Sunday';
        }
    }

    function weekDay(date) {
        let partial = date[0];
        return convertPartial(partial)
    }

    function month(date) {
        let partial = date[1];
        switch (partial) {
            case 'Jan':
                return 'January';
            case 'Feb':
                return 'February';
            case 'Mar':
                return 'March';
            case 'Apr':
                return 'April';
            case 'May':
                return 'May';
            case 'Jun':
                return 'June';
            case 'Jul':
                return 'July';
            case 'Aug':
                return 'August';
            case 'Sep':
                return 'September';
            case 'Oct':
                return 'October';
            case 'Nov':
                return 'November';
            case 'Dec':
                return 'December';
        }
    }

    let date = new Date().toDateString().split(' ');
    let weekdayDateDisplay = $("#weekday-date");
    weekdayDateDisplay.text(weekDay(date) + ', ' + month(date) + ' ' + date[2]);

    mapbox.init();

});

import {mapbox} from "./map.js";
