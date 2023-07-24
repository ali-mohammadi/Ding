var socket;
var $_GET = getUrlVars();

function pageNext(page) {
    page.removeClass('initial');
    page.toggleClass('deactive');
    page.removeClass('active reactive');
    if ($(page.attr('data-next')).hasClass('deactive')) {
        $(page.attr('data-next')).removeClass('deactive')
        $(page.attr('data-next')).addClass('reactive')
    }
    else {
        $(page.attr('data-next')).addClass('active')
    }
}

function pagePrev(page) {
    page.removeClass('initial');
    page.removeClass('active reactive');
    if ($(page.attr('data-prev')).hasClass('deactive')) {
        $(page.attr('data-prev')).removeClass('deactive')
        $(page.attr('data-prev')).addClass('reactive')
    }
    else {
        $(page.attr('data-prev')).addClass('active')
    }
}

function goToPage(currentPage, targetPage) {
    targetPage.attr('data-prev', '#' + currentPage.attr('id'))
    currentPage.removeClass('initial');
    currentPage.toggleClass('deactive');
    currentPage.removeClass('active reactive');
    if (targetPage.hasClass('deactive')) {
        targetPage.removeClass('deactive')
        targetPage.addClass('reactive')
    }
    else {
        targetPage.addClass('active')
    }
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function initialChatList(list) {
    var html = '';
    if (list.length != 0) {
        for (var item of list) {
            html += '<div class="chat-list_item d-flex align-items-center waves-effect" data-user-id="' + item.user_id + '">' +
                '<div class="chat-list_item__avatar">' +
                '<img src="images/default-profile.png" class="rounded-circle">' +
                '</div>' +
                '<div class="chat-list_item__info d-flex border-bottom w-100">' +
                '<div>' +
                '<p class="dark mb-0 black-text name" style="font-weight: 500">' + item.name + '</p>' +
                '<p class="mb-0 grey-text message">' + item.message + '</p>' +
                '</div>' +
                '<div class="ml-auto chat-list_item__meta d-flex flex-column align-items-end">' +
                '<time class="time grey-text font-small mb-1">' + item.date + '</time>';
            if (item.unseen > 0) html += '<div class="unseen deep-purple white-text rounded-circle">' + item.unseen + '</div>';
            html += '</div>' +
                '</div>' +
                '</div>';
        }
    }
    else {
        html = '<div class="chat-list_item text-center py-3">No Friend here yet...</div>'
    }
    $('.chat-list').html(html)
}

function initialChatWindow(uid) {
    $.ajax({
        url: '/user?id=' + uid,
        method: 'GET',
        success: function (data) {
            data = JSON.parse(data);
            data = data.result;
            var name = data.name;
            if (data.last_name != null) name += ' ' + data.last_name;
            var status = (data.status == 0) ? 'Offline' : 'Online';
            $('#chat-window').attr('data-user-id', data.id);
            $('.chat-window_name_status .name').text(name);
            $('.chat-window_name_status .status').text(status);

            socket.emit('message/get', '{"user_id": ' + data.id + '}');

            socket.on('message/get', function (messages) {
                messages = JSON.parse(messages);
                var html = ''
                if (messages.length != 0) {
                    for (var msg of messages) {
                        html += '<li class="messages-list-item ' + msg.sender + '">' +
                            '<span class="message">' + msg.message + '</span>' +
                            '<time>' + moment(msg.date).format('HH:mm') + '</time>' +
                            '</li>';
                    }
                }
                else {
                    '<li>No messages here yet...</li>'
                }
                $('#messages-list').html(html)
            });

            var page = $('.page.active');
            if(page.length == 0) page = $('.page.reactive');
            goToPage(page, $('#chat-window'));

        },
        error: function (err) {
            console.log(err)
        }
    })
}

function verifyPhone(cb, button) {
    var number = $("#phone-number").val();
    var re = new RegExp('0?9[0-9]{9}');
    if (re.test(String(number).toLowerCase())) {
        cb(button);
    } else {
        alert("Phone number is invalid!");
    }
}

$(document).ready(function () {
    $('.page-btn').click(function () {
        var button = this;
        var pageNavigate = function(button) {
            var page = $(button).parents('section.page');
            if ($(button).hasClass('next')) {
                pageNext(page)
            }
            else {
                pagePrev(page)
            }
        }

        if ($(this).attr('callback') !== undefined) {
            var callback = $(this).attr('callback');
            window[callback](pageNavigate, button);
        } else {
            pageNavigate(button);
        }
    })

    $('#register-submit').click(function () {
        var send_data = new Object();
        send_data.phoneNumber = $('#phone-number').val();
        send_data.name = $('#first-name').val();
        send_data.lastName = $('#last-name').val();
        $.ajax({
            url: '/register',
            method: 'POST',
            data: send_data,
            async: true,
            dataType: 'json',
            success: function (result) {
                new_send_data = new Object();
                new_send_data.phoneNumber = $('#phone-number').val();
                $.ajax({
                    url: '/login',
                    method: 'POST',
                    data: new_send_data,
                    dataType: 'json',
                    success: function (result) {
                        window.location.href = '/dashboard?token=' + result.result;
                    },
                    error: function (err) {
                        alert(err.responseJSON.result);
                    }
                })
            },
            error: function (err) {
                alert(err.responseJSON.result)
            }
        });
    });

    $('#submit-message').click(function (e) {
        e.preventDefault();
        var message = $('input#message').val();
        var contact_id = $('#chat-window').attr('data-user-id');
        if(message.length != 0) {
            $('input#message').val('');
            message = message.trim();
            socket.emit('message/send', '{"to_id": ' + contact_id + ', "message": "' + message + '"}');
            var html = '<li class="messages-list-item you">' +
                '<span class="message">' + message + '</span>' +
                '<time>' + moment().format('HH:mm') + '</time>' +
                '</li>';
            $('#messages-list').append(html);
            $('.messages-box').scrollTop($('.messages-box')[0].scrollHeight);
        }
    });

    $('#find-friend-submit').click(function (e) {
        e.preventDefault();
        var phoneNumber = $('#find-friend').val();
        if(phoneNumber.length != 0) {
            $.ajax({
                url: '/user?phoneNumber=' + phoneNumber,
                method: 'GET',
                success: function (data) {
                    data = JSON.parse(data);
                    var page = $('section.active');
                    initialChatWindow(data.result);
                },
                error: function (data) {
                    console.log(data);
                }
            })
        }
    });

    $(document).on('click', '.chat-list_item', function () {
        var uid = $(this).attr('data-user-id');
        initialChatWindow(uid);
    });
});

window.addEventListener('load', function () {
    window.history.pushState({noBackExitsApp: true}, '')
})

window.addEventListener('popstate', function (event) {
    if (event.state && event.state.noBackExitsApp) {
        window.history.pushState({noBackExitsApp: true}, '')
        var page = $('.page.active');
        pagePrev(page)
    }
})