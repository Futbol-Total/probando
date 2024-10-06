// ---------------------------------
// ---------- widgetLiveScore ----------
// ---------------------------------
// Widget for LiveScore Display
// ------------------------
;
(function($, window, document, undefined) {

    var widgetLiveScore = 'widgetLiveScore';

    function Plugin(element, options) {
        this.element = element;
        this._name = widgetLiveScore;
        this._defaults = $.fn.widgetLiveScore.defaults;
        this.options = $.extend({}, this._defaults, options);

        this.init();
    }

    $.extend(Plugin.prototype, {

        // Initialization logic
        init: function() {
            this.buildCache();
            this.bindEvents();
            this.initialContent(this.options.liveScoreDetailsAjaxURL, this.options.method, this.options.widgetKey, this.options.timezone);
        },

        // Remove plugin instance completely
        destroy: function() {
            this.unbindEvents();
            this.$element.removeData();
        },

        // Cache DOM nodes for performance
        buildCache: function() {
            this.$element = $(this.element);
        },

        // Bind events that trigger methods
        bindEvents: function() {
            var plugin = this;
        },

        // Unbind events that trigger methods
        unbindEvents: function() {
            this.$element.off('.' + this._name);
        },

        initialContent: function(liveScoreDetailsAjaxURL, method, widgetKey, timezone) {

            // Get widget location
            var liveScoreLocation = $(this.element);

            // Construct the Live Games Tab click
            $('<a href="#liveGame" class="titleWidget nav-tab">Live Games</a>').prependTo($(liveScoreLocation));
            // Construct the All Games Tab click
            $('<a href="#allGame" class="titleWidget nav-tab nav-tab-active">All Games</a>').prependTo($(liveScoreLocation));
            // Construct the Calendar Tab click
            $('<div id="liveScoreCalendarContainer"></div>').prependTo($(liveScoreLocation));

            // If window size is less then 769px we add loading screen
            var windowWidthSize = $(window).width();
            if (windowWidthSize < 769) {
                $('<div class="loading">Loading&#8230;</div>').prependTo($(liveScoreLocation));
            }

            // Add hook in HTML for All Games Tab content infos and make it active
            $(liveScoreLocation).append('<div id="allGame" class="allGame-nav-tab-wrapper tab-content active"></div>');

            // Adding the "widgetLiveScore" class for styling and easyer targeting
            liveScoreLocation.addClass('widgetLiveScore');

            // If backgroundColor setting is set, here we activate the color
            if (this.options.backgroundColor) {
                liveScoreLocation.css('background-color', this.options.backgroundColor);
            }

            // If widgetWidth setting is set, here we set the width of the list 
            if (this.options.widgetWidth) {
                liveScoreLocation.css('width', this.options.widgetWidth);
            }

            // Adding callendar with All Games for 3 days before and after current day
            var getTimeZoneForSlowConn = setInterval(function () {
                if (timeForFixtures.length > 0) {
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'threeDayAfter', 3, 'addDateCalendar');
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'twoDayAfter', 2, 'addDateCalendar');
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'oneDayAfter', 1, 'addDateCalendar');
                    $('<a href="#" onclick="windowPreventOpening()" id="currentDayCalendar" class="thisDateForSelect callendarDays callendarDaysActive" data-dateclicked="' + timeForFixtures + '">Current Day</a>').prependTo($('#liveScoreCalendarContainer'));
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'oneDayBefore', 1, 'substractDateCalendar');
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'twoDayBefore', 2, 'substractDateCalendar');
                    getDateCalendar('liveScoreCalendarContainer', timeForFixtures, 'threeDayBefore', 3, 'substractDateCalendar');

                    // When a day is clicked we make it active and populate All Games tab
                    $('#liveScoreCalendarContainer').find('.thisDateForSelect').unbind('click').on('click', function() {
                        $(this).addClass('callendarDaysActive');
                        $(this).siblings().removeClass('callendarDaysActive');
                        $('#allGame').html('<div class="loading">Loading&#8230;</div>').addClass('active').siblings().removeClass('active');
                        $('.widgetLiveScore .titleWidget').removeClass('nav-tab-active').first().addClass('nav-tab-active');
                        // Aditionally we send a request to server for infos
                        $.ajax({
                            url: liveScoreDetailsAjaxURL,
                            cache: false,
                            data: {
                                met: 'Fixtures',
                                widgetKey: widgetKey,
                                from: $(this).attr("data-dateclicked"),
                                to: $(this).attr("data-dateclicked"),
                                timezone: getTimeZone(),
                                withoutDetails: true
                            },
                            dataType: 'json'
                        }).done(function(res) {
                            // Hide loading screen
                            $('.loading').hide();
                            // Construct the section for All Games in that specific day
                            $('#allGame').append('<section id="allGameContentTable"></section>');
                            // If server send results we populate HTML with sended information
                            if (res.result) {
                                // Order information by Event Time and then group them by Country Name
                                var windowWidthSize = $(window).width();
                                var sorted = sortByKey(res.result, 'key');
                                var sorted_array = sortByKeyAsc(sorted, "event_time");
                                var groubedByTeam = groupBy(sorted_array, 'country_name');
                                const orderedLeagues = {};
                                Object.keys(groubedByTeam).sort().forEach(function(key) {
                                    orderedLeagues[key] = groubedByTeam[key];
                                });
                                var htmlConstructor = '<div class="tablele-container">';
                                $.each(orderedLeagues, function(keyes, valuees) {
                                    var sortedValuess = groupBy(valuees, 'league_name');
                                    $.each(sortedValuess, function(key, value) {
                                        htmlConstructor += '<div class="flex-table header" role="rowgroup">';
                                        htmlConstructor += '<div class="countryListDisplays"><div class="countryLogo" style="background-image: url(\'' + ((value[0].country_logo == '' || value[0].country_logo == null) ? 'img/no-img.png' : value[0].country_logo) + '\');"></div>';
                                        htmlConstructor += '<div title="' + ((key) ? key : 'Team') + '" class="flex-row keyOfTeam" onclick="windowOpenLeagueInfo(\'' + value[0].league_key + '\',\'' + value[0].league_name +'\', \'' + value[0].league_logo + '\')" role="columnheader">' + ((value[0].country_name) ? '<span class="countryOfTeams">' + value[0].country_name + ':</span>' : '') + ' ' + ((key) ? key : 'Team') + '</div>';
                                        htmlConstructor += '</div>';
                                        htmlConstructor += '</div>';
                                        htmlConstructor += '<div class="table__body_fixtures">';
                                        $.each(value, function(keys, values) {
                                            if (values.event_final_result == null) {
                                                var event_final_result_class_away = '';
                                                var event_final_result_class_home = '';
                                            } else {
                                                var event_final_result_class_var = values.event_final_result;
                                                var event_final_result_class = event_final_result_class_var.replace(/:/g, '-');

                                                var event_final_result_class_away = $.trim(event_final_result_class.substr(event_final_result_class.indexOf("-") + 1));
                                                var event_final_result_class_home = $.trim(event_final_result_class.substr(0, event_final_result_class.indexOf('-')));
                                            }
                                            if (values.event_status) {
                                                var removeNumericAdd = values.event_status.replace('+', '');
                                            } else {
                                                var removeNumericAdd = values.event_status;
                                            }
                                            var generatedLink = values.country_name+'/'+values.league_name+'/'+values.event_home_team+'-vs-'+values.event_away_team+'/'+values.event_date+'/'+values.event_key;
                                            var newGeneratedLink = generatedLink.replace(/\s/g,'-');
                                            htmlConstructor += '<a href="widgetMatchResults.html?'+newGeneratedLink+'" class="' + ((windowWidthSize < 769) ? 'container-mobile-grid' : '') + ' flex-table row ' + values.event_key + '" role="rowgroup" onclick="event.preventDefault(); windowOpenMatch(' + values.event_key + ', false, \'' + values.event_date + '\', \'' + values.country_name + '\', \'' + values.league_name + '\', \'' + values.event_home_team + '\', \'' + values.event_away_team + '\')" title="Click for match detail!">';
                                            htmlConstructor += '<div class="' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell"> ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? values.event_status + ((removeNumericAdd == 'Half Time') ? '' : '\'') : values.event_time) + '</div>';
                                            htmlConstructor += '<div class="' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? 'd-none-mobile-div' : (((values.event_status == null) || values.event_status == '') ? 'd-none-mobile-div' : '')) + ' ' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails secondMatchDetails" role="cell">' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? '' : ((values.event_status == null) ? '' : values.event_status)) + '</div>';
                                            htmlConstructor += ((windowWidthSize < 769) ? '<div class="break-mobile-grid"></div>' : '');
                                            if (event_final_result_class_home > event_final_result_class_away) {
                                                htmlConstructor += '<div class="flex-row matchHomeTeam winningMatchStyle" role="cell">' + values.event_home_team + '</div>';
                                                htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                                htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                            } else if (event_final_result_class_home < event_final_result_class_away) {
                                                htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                                htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                                htmlConstructor += '<div class="flex-row matchAwayTeam winningMatchStyle" role="cell">' + values.event_away_team + '</div>';
                                            } else if (event_final_result_class_home == event_final_result_class_away) {
                                                htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                                htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                                htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                            }
                                            htmlConstructor += '<div class="' + ((((windowWidthSize < 769) && (values.event_halftime_result == '')) || ((windowWidthSize < 769) && (values.event_halftime_result == null))) ? 'd-none-mobile-div' : '') + ' flex-row matchAwayTeam firstHalfStyle ' + ((windowWidthSize < 769) ? 'mobile-firstHalfStyle d-none-mobile-div' : '') + '" role="cell">' + ((values.event_halftime_result) ? '(' + values.event_halftime_result + ')' : '') + '</div>';
                                            htmlConstructor += '</a>';
                                        });
                                        htmlConstructor += '</div>';
                                    });
                                });
                                htmlConstructor += '</div>';
                                $('#allGameContentTable').append(htmlConstructor);

                            } else {

                                // If server dont send results we populate HTML with "Sorry, no data!"
                                var htmlConstructor = '<div class="tablele-container">';
                                htmlConstructor += '<p class="" style="border-left: solid 0px transparent; margin-left:auto; margin-right:auto; margin-top: 5px;">Sorry, no data!</p>';
                                htmlConstructor += '</div>';
                                $('#allGameContentTable').append(htmlConstructor);
                            }

                        }).fail(function(error) {

                        });

                    });
                
                    // We send a request to server for All Games infos
                    $.ajax({
                        url: liveScoreDetailsAjaxURL,
                        cache: false,
                        data: {
                            met: 'Fixtures',
                            widgetKey: widgetKey,
                            from: timeForFixtures,
                            to: timeForFixtures,
                            timezone: getTimeZone(),
                            withoutDetails: true
                        },
                        dataType: 'json'
                    }).done(function(res) {

                        // Hide loading screen
                        $('.loading').hide();
                        // Construct the section for today Games
                        $('#allGame').append('<section id="allGameContentTable"></section>');
                        // If server send results we populate HTML with sended information
                        if (res.result) {

                            // Order information by Event Time and then group them by Country Name
                            var windowWidthSize = $(window).width();
                            var sorted = sortByKey(res.result, 'key');
                            var sorted_array = sortByKeyAsc(sorted, "event_time");
                            var groubedByTeam = groupBy(sorted_array, 'country_name');
                            const orderedLeagues = {};
                            Object.keys(groubedByTeam).sort().forEach(function(key) {
                                orderedLeagues[key] = groubedByTeam[key];
                            });
                            var htmlConstructor = '<div class="tablele-container">';
                            $.each(orderedLeagues, function(keyes, valuees) {
                                var sortedValuess = groupBy(valuees, 'league_name');
                                $.each(sortedValuess, function(key, value) {
                                    htmlConstructor += '<div class="flex-table header" role="rowgroup">';
                                    htmlConstructor += '<div class="countryListDisplays"><div class="countryLogo" style="background-image: url(\'' + ((value[0].country_logo == '' || value[0].country_logo == null) ? 'img/no-img.png' : value[0].country_logo) + '\');"></div>';
                                    htmlConstructor += '<div title="' + ((key) ? key : 'Team') + '" class="flex-row keyOfTeam" onclick="windowOpenLeagueInfo(\'' + value[0].league_key + '\',\'' + value[0].league_name +'\', \'' + value[0].league_logo + '\')" role="columnheader">' + ((value[0].country_name) ? '<span class="countryOfTeams">' + value[0].country_name + ':</span>' : '') + ' ' + ((key) ? key : 'Team') + '</div>';
                                    htmlConstructor += '</div>';
                                    htmlConstructor += '</div>';
                                    htmlConstructor += '<div class="table__body_fixtures">';
                                    $.each(value, function(keys, values) {
                                        if (values.event_final_result == null) {
                                            var event_final_result_class_away = '';
                                            var event_final_result_class_home = '';
                                        } else {
                                            var event_final_result_class_var = values.event_final_result;
                                            var event_final_result_class = event_final_result_class_var.replace(/:/g, '-');

                                            var event_final_result_class_away = $.trim(event_final_result_class.substr(event_final_result_class.indexOf("-") + 1));
                                            var event_final_result_class_home = $.trim(event_final_result_class.substr(0, event_final_result_class.indexOf('-')));
                                        }
                                        if (values.event_status) {
                                            var removeNumericAdd = values.event_status.replace('+', '');
                                        } else {
                                            var removeNumericAdd = values.event_status;
                                        }
                                        var generatedLink = values.country_name+'/'+values.league_name+'/'+values.event_home_team+'-vs-'+values.event_away_team+'/'+values.event_date+'/'+values.event_key;
                                        var newGeneratedLink = generatedLink.replace(/\s/g,'-');
                                        htmlConstructor += '<a href="widgetMatchResults.html?'+newGeneratedLink+'" class="' + ((windowWidthSize < 769) ? 'container-mobile-grid' : '') + ' flex-table row ' + values.event_key + '" role="rowgroup" onclick="event.preventDefault(); windowOpenMatch(' + values.event_key + ', false, \'' + values.event_date + '\', \'' + values.country_name + '\', \'' + values.league_name + '\', \'' + values.event_home_team + '\', \'' + values.event_away_team + '\')" title="Click for match detail!">';
                                        htmlConstructor += '<div class="' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell"> ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? values.event_status + ((removeNumericAdd == 'Half Time') ? '' : '\'') : values.event_time) + '</div>';
                                        htmlConstructor += '<div class="' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? 'd-none-mobile-div' : (((values.event_status == null) || values.event_status == '') ? 'd-none-mobile-div' : '')) + ' ' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails secondMatchDetails" role="cell">' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? '' : ((values.event_status == null) ? '' : values.event_status)) + '</div>';
                                        htmlConstructor += ((windowWidthSize < 769) ? '<div class="break-mobile-grid"></div>' : '');
                                        if (event_final_result_class_home > event_final_result_class_away) {
                                            htmlConstructor += '<div class="flex-row matchHomeTeam winningMatchStyle" role="cell">' + values.event_home_team + '</div>';
                                            htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                            htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                        } else if (event_final_result_class_home < event_final_result_class_away) {
                                            htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                            htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                            htmlConstructor += '<div class="flex-row matchAwayTeam winningMatchStyle" role="cell">' + values.event_away_team + '</div>';
                                        } else if (event_final_result_class_home == event_final_result_class_away) {
                                            htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                            htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                            htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                        }
                                        htmlConstructor += '<div class="' + ((((windowWidthSize < 769) && (values.event_halftime_result == '')) || ((windowWidthSize < 769) && (values.event_halftime_result == null))) ? 'd-none-mobile-div' : '') + ' flex-row matchAwayTeam firstHalfStyle ' + ((windowWidthSize < 769) ? 'mobile-firstHalfStyle d-none-mobile-div' : '') + '" role="cell">' + ((values.event_halftime_result) ? '(' + values.event_halftime_result + ')' : '') + '</div>';
                                        htmlConstructor += '</a>';
                                    });
                                    htmlConstructor += '</div>';
                                });
                            });
                            htmlConstructor += '</div>';
                            $('#allGameContentTable').append(htmlConstructor);

                        } else {

                            // If server dont send results we populate HTML with "Sorry, no data!"
                            var htmlConstructor = '<div class="tablele-container">';
                            htmlConstructor += '<p class="" style="border-left: solid 0px transparent; margin-left:auto; margin-right:auto; margin-top: 5px;">Sorry, no data!</p>';
                            htmlConstructor += '</div>';
                            $('#allGameContentTable').append(htmlConstructor);
                        }
                    }).fail(function(error) {

                    });
                    clearInterval(getTimeZoneForSlowConn);
                }
            }, 10);

            // Add hook in HTML for Live Games Tab content infos
            var htmlConstructorResults = '<div id="liveGame" class="liveGame-nav-tab-wrapper tab-content">';
          function loadLivescore(){
            // Call Livescore Data from server
            $.ajax({
                url: liveScoreDetailsAjaxURL,
                cache: false,
                data: {
                    met: 'Livescore',
                    widgetKey: widgetKey,
                    timezone: getTimeZone(),
                    withoutDetails: true
                },
                dataType: 'json'
            }).done(function(res) {
                // Clear the Live Games HTML
                $('#liveGame').html('');
                // Construct the section for Live Games
                $('#liveGame').append('<section id="liveGameContentTable"></section>');
                // If server send results we populate HTML with sended information
                if (res.result) {
                    // Order information by Event Time and then group them by Country Name
                    var windowWidthSize = $(window).width();
                    var sorted = sortByKey(res.result, 'key');
                    var sorted_array = sortByKeyAsc(sorted, "event_time");
                    var groubedByTeam = groupBy(sorted_array, 'country_name');
                    const orderedLeagues = {};
                    Object.keys(groubedByTeam).sort().forEach(function(key) {
                        orderedLeagues[key] = groubedByTeam[key];
                    });
                    var htmlConstructor = '<div class="tablele-container">';
                    $.each(orderedLeagues, function(keyes, valuees) {
                        var sortedValuess = groupBy(valuees, 'league_name');
                        $.each(sortedValuess, function(key, value) {
                            htmlConstructor += '<div class="flex-table header" role="rowgroup">';
                            htmlConstructor += '<div class="countryListDisplays"><div class="countryLogo" style="background-image: url(\'' + ((value[0].country_logo == '' || value[0].country_logo == null) ? 'img/no-img.png' : value[0].country_logo) + '\');"></div>';
                            htmlConstructor += '<div title="' + ((key) ? key : 'Team') + '" class="flex-row keyOfTeam" onclick="windowOpenLeagueInfo(\'' + value[0].league_key + '\',\'' + value[0].league_name +'\', \'' + value[0].league_logo + '\')" role="columnheader">' + ((value[0].country_name) ? '<span class="countryOfTeams">' + value[0].country_name + ':</span>' : '') + ' ' + ((key) ? key : 'Team') + '</div>';
                            htmlConstructor += '</div>';
                            htmlConstructor += '</div>';
                            htmlConstructor += '<div class="table__body_fixtures">';
                            $.each(value, function(keys, values) {
                                if (values.event_final_result == null) {
                                    var event_final_result_class_away = '';
                                    var event_final_result_class_home = '';
                                } else {
                                    var event_final_result_class_var = values.event_final_result;
                                    var event_final_result_class = event_final_result_class_var.replace(/:/g, '-');
                                    var event_final_result_class_away = $.trim(event_final_result_class.substr(event_final_result_class.indexOf("-") + 1));
                                    var event_final_result_class_home = $.trim(event_final_result_class.substr(0, event_final_result_class.indexOf('-')));
                                }
                                if (values.event_status) {
                                    var removeNumericAdd = values.event_status.replace('+', '');
                                } else {
                                    var removeNumericAdd = values.event_status;
                                }
                                var generatedLink = values.country_name+'/'+values.league_name+'/'+values.event_home_team+'-vs-'+values.event_away_team+'/'+values.event_date+'/'+values.event_key;
                                var newGeneratedLink = generatedLink.replace(/\s/g,'-');
                                htmlConstructor += '<a href="widgetMatchResults.html?'+newGeneratedLink+'" class="' + ((windowWidthSize < 769) ? 'container-mobile-grid' : '') + ' flex-table row ' + values.event_key + '" role="rowgroup" onclick="event.preventDefault(); windowOpenMatch(' + values.event_key + ', false, \'' + values.event_date + '\', \'' + values.country_name + '\', \'' + values.league_name + '\', \'' + values.event_home_team + '\', \'' + values.event_away_team + '\')" title="Click for match detail!">';
                                htmlConstructor += '<div class="' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell"> ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? values.event_status + ((removeNumericAdd == 'Half Time') ? '' : '\'') : values.event_time) + '</div>';
                                htmlConstructor += '<div class="' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? 'd-none-mobile-div' : (((values.event_status == null) || values.event_status == '') ? 'd-none-mobile-div' : '')) + ' ' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails secondMatchDetails" role="cell">' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? '' : ((values.event_status == null) ? '' : values.event_status)) + '</div>';
                                htmlConstructor += ((windowWidthSize < 769) ? '<div class="break-mobile-grid"></div>' : '');
                                if (event_final_result_class_home > event_final_result_class_away) {
                                    htmlConstructor += '<div class="flex-row matchHomeTeam winningMatchStyle" role="cell">' + values.event_home_team + '</div>';
                                    htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                    htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                } else if (event_final_result_class_home < event_final_result_class_away) {
                                    htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                    htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                    htmlConstructor += '<div class="flex-row matchAwayTeam winningMatchStyle" role="cell">' + values.event_away_team + '</div>';
                                } else if (event_final_result_class_home == event_final_result_class_away) {
                                    htmlConstructor += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                    htmlConstructor += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                    htmlConstructor += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                                }
                                htmlConstructor += '<div class="' + ((((windowWidthSize < 769) && (values.event_halftime_result == '')) || ((windowWidthSize < 769) && (values.event_halftime_result == null))) ? 'd-none-mobile-div' : '') + ' flex-row matchAwayTeam firstHalfStyle ' + ((windowWidthSize < 769) ? 'mobile-firstHalfStyle d-none-mobile-div' : '') + '" role="cell">' + ((values.event_halftime_result) ? '(' + values.event_halftime_result + ')' : '') + '</div>';
                                htmlConstructor += '</a>';
                            });
                            htmlConstructor += '</div>';
                        });
                    });
                    htmlConstructor += '</div>';
                    $('#liveGameContentTable').append(htmlConstructor);

                } else {

                    // If server dont send results we populate HTML with "Sorry, no data!"
                    var htmlConstructor = '<div class="tablele-container">';
                    htmlConstructor += '<p class="" style="border-left: solid 0px transparent; margin-left:auto; margin-right:auto; margin-top: 5px;">Sorry, no data!</p>';
                    htmlConstructor += '</div>';
                    $('#liveGameContentTable').append(htmlConstructor);
                }
            }).fail(function(error) {

            });
            setTimeout(function(){
              loadLivescore();
            }, 300000);
          }


            function socketsLive(){
              var socket  = new WebSocket('wss://wss.allsportsapi.com/live_events?widgetKey='+widgetKey+'&timezone='+getTimeZone());
              // Define the
              socket.onmessage = function(e) {
  //                alert( e.data );

                  if (e.data) {
                    var data = JSON.parse(e.data);
                      var windowWidthSize = $(window).width();
                      $.each(data, function(keys, values) {
                          if (values.event_final_result == null) {
                              var event_final_result_class_away = '';
                              var event_final_result_class_home = '';
                          } else {
                              var event_final_result_class_var = values.event_final_result;
                              var event_final_result_class = event_final_result_class_var.replace(/:/g, '-');
                              var event_final_result_class_away = $.trim(event_final_result_class.substr(event_final_result_class.indexOf("-") + 1));
                              var event_final_result_class_home = $.trim(event_final_result_class.substr(0, event_final_result_class.indexOf('-')));
                          }
                          if (values.event_status) {
                              var removeNumericAdd = values.event_status.replace('+', '');
                          } else {
                              var removeNumericAdd = values.event_status;
                          }
                          var newDataForMatch = '<div class="' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell"> ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? values.event_status + ((removeNumericAdd == 'Half Time') ? '' : '\'') : values.event_time) + '</div>';
                          newDataForMatch += '<div class="' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? 'd-none-mobile-div' : ((values.event_status == null) ? 'd-none-mobile-div' : '')) + ' ' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails secondMatchDetails" role="cell">' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? '' : ((values.event_status == null) ? '' : values.event_status)) + '</div>';
                          newDataForMatch += ((windowWidthSize < 769) ? '<div class="break-mobile-grid"></div>' : '');
                          if (event_final_result_class_home > event_final_result_class_away) {
                              newDataForMatch += '<div class="flex-row matchHomeTeam winningMatchStyle" role="cell">' + values.event_home_team + '</div>';
                              newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                              newDataForMatch += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                          } else if (event_final_result_class_home < event_final_result_class_away) {
                              newDataForMatch += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                              newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                              newDataForMatch += '<div class="flex-row matchAwayTeam winningMatchStyle" role="cell">' + values.event_away_team + '</div>';
                          } else if (event_final_result_class_home == event_final_result_class_away) {
                              newDataForMatch += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                              newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                              newDataForMatch += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                          }
                          newDataForMatch += '<div class="' + ((((windowWidthSize < 769) && (values.event_halftime_result == '')) || ((windowWidthSize < 769) && (values.event_halftime_result == null))) ? 'd-none-mobile-div' : '') + ' flex-row matchAwayTeam firstHalfStyle ' + ((windowWidthSize < 769) ? 'mobile-firstHalfStyle d-none-mobile-div' : '') + '" role="cell">' + ((values.event_halftime_result) ? '(' + values.event_halftime_result + ')' : '') + '</div>';
                          $('.' + values.event_key).html('').html(newDataForMatch);
                      });
                  } else {
                      // If server dont send new data we populate console.log with "No new data!"
                      console.log('No new data!');
                  }
              }
              socket.onclose = function(){
                // connection closed, discard old websocket and create a new one in 5s
                socket = null;
                setTimeout(socketsLive, 5000);
              }

            }


          loadLivescore();



          socketsLive();

          function livescoreWithoutSockets(){
            // Set periodical call to server for new live score datas
            setInterval(function() {

                // Call Livescore Data from server
                $.ajax({
                    url: liveScoreDetailsAjaxURL,
                    cache: false,
                    data: {
                        met: 'Livescore',
                        widgetKey: widgetKey,
                        timezone: getTimeZone()
                    },
                    dataType: 'json'
                }).done(function(res) {
                    // If server send results we populate HTML with sended information
                    if (res.result) {
                        var windowWidthSize = $(window).width();
                        $.each(res.result, function(keys, values) {
                            if (values.event_final_result == null) {
                                var event_final_result_class_away = '';
                                var event_final_result_class_home = '';
                            } else {
                                var event_final_result_class_var = values.event_final_result;
                                var event_final_result_class = event_final_result_class_var.replace(/:/g, '-');
                                var event_final_result_class_away = $.trim(event_final_result_class.substr(event_final_result_class.indexOf("-") + 1));
                                var event_final_result_class_home = $.trim(event_final_result_class.substr(0, event_final_result_class.indexOf('-')));
                            }
                            if (values.event_status) {
                                var removeNumericAdd = values.event_status.replace('+', '');
                            } else {
                                var removeNumericAdd = values.event_status;
                            }
                            var newDataForMatch = '<div class="' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell"> ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? values.event_status + ((removeNumericAdd == 'Half Time') ? '' : '\'') : values.event_time) + '</div>';
                            newDataForMatch += '<div class="' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? 'd-none-mobile-div' : ((values.event_status == null) ? 'd-none-mobile-div' : '')) + ' ' + ((windowWidthSize < 769) ? 'item-mobile-grid' : '') + ' flex-row matchDetails secondMatchDetails" role="cell">' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? '' : ((values.event_status == null) ? '' : values.event_status)) + '</div>';
                            newDataForMatch += ((windowWidthSize < 769) ? '<div class="break-mobile-grid"></div>' : '');
                            if (event_final_result_class_home > event_final_result_class_away) {
                                newDataForMatch += '<div class="flex-row matchHomeTeam winningMatchStyle" role="cell">' + values.event_home_team + '</div>';
                                newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                newDataForMatch += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                            } else if (event_final_result_class_home < event_final_result_class_away) {
                                newDataForMatch += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                newDataForMatch += '<div class="flex-row matchAwayTeam winningMatchStyle" role="cell">' + values.event_away_team + '</div>';
                            } else if (event_final_result_class_home == event_final_result_class_away) {
                                newDataForMatch += '<div class="flex-row matchHomeTeam" role="cell">' + values.event_home_team + '</div>';
                                newDataForMatch += '<div class="flex-row matchDelimiter ' + (($.isNumeric(removeNumericAdd) || (removeNumericAdd == 'Half Time')) ? ' matchIsLive' : '') + '" role="cell">' + ((values.event_final_result) ? values.event_final_result : '-') + '</div>';
                                newDataForMatch += '<div class="flex-row matchAwayTeam" role="cell">' + values.event_away_team + '</div>';
                            }
                            newDataForMatch += '<div class="' + ((((windowWidthSize < 769) && (values.event_halftime_result == '')) || ((windowWidthSize < 769) && (values.event_halftime_result == null))) ? 'd-none-mobile-div' : '') + ' flex-row matchAwayTeam firstHalfStyle ' + ((windowWidthSize < 769) ? 'mobile-firstHalfStyle d-none-mobile-div' : '') + '" role="cell">' + ((values.event_halftime_result) ? '(' + values.event_halftime_result + ')' : '') + '</div>';
                            $('.' + values.event_key).html('').html(newDataForMatch);
                        });
                    } else {
                        // If server dont send new data we populate console.log with "No new data!"
                        console.log('No new data!');
                    }
                }).fail(function(error) {

                });

            // Set time for periodicaly check of live score - 1000 = 1 second
            }, 30000);
          }
            htmlConstructorResults += '</div>';
            $(liveScoreLocation).append(htmlConstructorResults);
            // Switching tabs on click
            $('.widgetLiveScore .nav-tab').unbind('click').on('click', function(e) {
                e.preventDefault();
                //Toggle tab link
                $(this).addClass('nav-tab-active').siblings().removeClass('nav-tab-active');
                //Toggle target tab
                $($(this).attr('href')).addClass('active').siblings().removeClass('active');
            });
        },

        callback: function() {

        }

    });

    $.fn.widgetLiveScore = function(options) {
        this.each(function() {
            if (!$.data(this, "plugin_" + widgetLiveScore)) {
                $.data(this, "plugin_" + widgetLiveScore, new Plugin(this, options));
            }
        });
        return this;
    };

    $.fn.widgetLiveScore.defaults = {
        // WidgetKey will be set in jqueryGlobals.js and can be obtained from your account
        widgetKey: widgetKey,
        // Motod for this widget
        method: 'LiveScore',
        // Link to server data
        liveScoreDetailsAjaxURL: 'https://apiv2.allsportsapi.com/football/',
        // Background color for your Leagues Widget
        backgroundColor: null,
        // Width for your widget
        widgetWidth: '81%',
        // Get the time zone of your location
        timezone: getTimeZone()
    };

})(jQuery, window, document);