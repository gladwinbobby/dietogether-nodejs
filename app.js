const app = require("express")();
const http = require('http').Server(app);
const io = require('socket.io')(http);

http.listen(process.env.PORT || 3000);

app.get("/", (req, res) => {
    res.send("Hey there!");
});

var users = [];

io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.code && socket.handshake.query.name && socket.handshake.query.battery) {
        socket.code = socket.handshake.query.code;
        socket.name = socket.handshake.query.name;
        socket.battery = socket.handshake.query.battery;
        next();
    } else {
        next(new Error("Params are missing from the request"));
    }
});
io.on('connection', (socket) => {
    users.push({
        id: socket.id,
        code: socket.code,
        name: socket.name,
        battery: socket.battery
    });
    socket.to(socket.code).emit('count', users.filter(o => o.code === socket.code));
    socket.on('add-message', (data) => {
        let index = users.indexOf(users.find(o => o.id === socket.id));
        if (index != -1) {
            users[index]['battery'] = data.battery;
            socket.to(socket.code).emit('new-message', {
                user: socket.name,
                battery: data.battery,
                message: data.message
            });
        }
    });
    socket.on('disconnect', () => {
        let index = users.indexOf(users.find(o => o.id === socket.id));
        if (index != -1) {
            let user = users[index];
            if (battery <= 1) {
                io.of(socket.code).emit('death', {
                    user: socket.name
                });
            }
            users.splice(index, 1);
            socket.to(socket.code).emit('count', users.filter(o => o.code === socket.code));
        }
    });
});