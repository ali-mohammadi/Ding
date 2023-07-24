var url = window.location.href
var arr = url.split("/");
socket = io.connect(arr[0] + "//" + arr[2]);
socket.on('connect', function () {
    socket.emit('user/token', $_GET['token']);
});
socket.on('status', function (status) {
    $('.chat-status').text(status);
});
socket.emit('message/list');
socket.on('message/list', function (list) {
    setTimeout(function () {
        initialChatList(list);
    }, 500)
    $('.messages-box').scrollTop($('.messages-box')[0].scrollHeight);
});

socket.on('message/message', function (message) {
    var msg = JSON.parse(message);
    var chat_window = $('#chat-window');
    if (chat_window.hasClass('active') && chat_window.attr('data-user-id') == msg.user_id) {
        var html = '<li class="messages-list-item contact">' +
            '<span class="message">' + msg.message + '</span>' +
            '<time>' + moment(msg.date).format('HH:mm') + '</time>' +
            '</li>';
        $('#messages-list').append(html);
        $('.messages-box').scrollTop($('.messages-box')[0].scrollHeight);
    }
})

socket.on('user/status', function (status) {
    var status = JSON.parse(status);
    var chat_window = $('#chat-window');
    if (chat_window.hasClass('active') && chat_window.attr('data-user-id') == status.user_id) {
        chat_window.find('.chat-window_name_status .status').text(status.status)
    }
});