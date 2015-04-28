var express = require('express');
var app = express();
var child_process = require('child_process');

app.use('/public', express.static('public'));
app.use(require('body-parser')());
app.use(require('express-session')({secret: "Lalalalalala"}));
app.set('view engine', 'ejs');


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'peni',
  database : 'vpn'
 });
connection.connect();


var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username, password, done) {
    // username, password => inputan user dari form
    // done => sebuah fungsi callback, kalau login cocok, argumen kedua isinya data user
    //         kalau nggak, argumen kedua isinya "false"
//    if(username == "admin" && password == "admin123") {
//        done(null, {username: "admin"})
//
//    } else {
//        done(null, false, {message: "User atau password salah"});
//    }
    connection.query("SELECT * FROM user WHERE username='" + username + "'", function(err, rows, fields) {
        if(rows.length > 0) {
            if(rows[0].password == password) {
                done(null, {username: username});
            } else {
                done(null, false);
            }
        } else {
            done(null, false);
        }

    });
}))

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


app.get('/', function(req, res) {
    res.redirect('/login');
});


app.get('/register', function(req, res) {
    res.render('login');
});

/*
app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    connection.query("INSERT INTO user VALUES ('" + username + "','" + password + "')", function(err, rows, fields) {
        res.end(username + " sudah didaftarkan. Silahkan login");
    });

});
*/
app.get('/login', function(req, res) {
    res.render('login');
});

//app.post('/login', function(req, res) {
//    // req.body => butuh body-parser buat mbacanya
//    if(req.body.username=="admin" && req.body.password=="admin123") {
//        // req.session => butuh express-session buat ngisinya
//        req.session.is_login = true;
//        req.session.username = "admin";
//        res.redirect('/app');
//    } else {
//        res.redirect('/login');
//    }
//});

app.post('/login', passport.authenticate('local', { successRedirect: '/app',
                                   failureRedirect: '/login',
                                   failureFlash: false })
);

app.get('/logout', function(req, res) {
});

var cekAutentikasi = function(req, res, done) {
    if(req.isAuthenticated()) {
        done();
    } else {
        res.redirect('/login');
    }
}
app.get('/app', cekAutentikasi,function(req, res) {
    res.render('app', {username: req.user.username});
});

app.get('/app/inisiasi', cekAutentikasi, function(req, res) {
    var ps = child_process.spawn('ssh', ['wira@192.168.56.103', 'sudo inisiasi.sh ' + req.user.username]);

    ps.on('exit', function(code) {
        if(code == 0) {
            res.end('Sukses');
        } else {
            res.end('Gagal');

        }

    });

});

app.get('/app/listdir', cekAutentikasi, function(req, res) {
    var ps = child_process.spawn('ssh', ['localhost', 'listdir.sh']);

    var hasil = "";

    ps.stdout.on('data', function(data) {
        hasil += data.toString();

    });

    ps.on('close', function() {
        hasil = JSON.parse(hasil);
        res.render('listdir', {dir: hasil});
    });
});


app.listen(4444);
