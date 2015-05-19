var express = require('express');
var app = express();
var nodemailer = require("nodemailer");
var child_process = require('child_process');

app.use('/public', express.static('public'));
app.use(require('body-parser')());
app.use(require('express-session')({secret: "Lalalalalala"}));
app.set('view engine', 'ejs');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "gmail",
    auth: {
        user: "alif.sip@gmail.com",
        pass: "megaphone"
    }
});

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123',
  database : 'vpn'
 });
connection.connect();

var sess;
var flag  = 1;

var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username, password, done) 
    {
        connection.query("SELECT * FROM user WHERE username='" + username + "'", function(err, rows, fields) 
        {
          if(rows.length > 0) {
            if(rows[0].password == password) {
                done(null, {username: username});
                
            } else {
                done(null, false);
            }
        } 
        else 
        {
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





/*---------------------------------------------------------------------------------------*/
/*------------------------------------FUNGSI---------------------------------------------*/

var cekAutentikasi = function(req, res, done) {
    if(req.isAuthenticated()) {
        done();
    } else {
        res.redirect('/home');
    }
}

/*------------------------------------------------------------------------------------*/
/*------------------------------------GET---------------------------------------------*/

app.get('/', cekAutentikasi, function(req, res) {
    res.render("dashboard");
});

app.get('/register', function(req, res) {
    if(req.isAuthenticated()){
	res.redirect('/dashboard');
    }
    else{
	res.render('register');
    }
});


//--dari form login di dalam home.ejs
app.get('/home', function(req, res) {
    res.render('home');
});

/*app.get('/plans', cekAutentikasi, function(req, res) {
    res.render('plans', {username: req.user.username});

});*/

app.get('/dashboard', cekAutentikasi, function(req, res) {
    res.render('dashboard');
});

app.get('/billingA', cekAutentikasi, function(req, res) {
    connection.query("SELECT paket.plan FROM user, paket WHERE user.paket=paket.idpaket and username='" + req.user.username + "'", function(err, rows, fields) 
        {
		 res.render('billingA', {data : rows[0].plan});
        });
});

app.get('/planA', cekAutentikasi, function(req, res) {
    res.render('planA');
});

app.get('/accountA', cekAutentikasi, function(req, res) {
    res.render('accountA');
});

app.get('/payment', cekAutentikasi, function(req, res) {
    var paket = req.param('plan');
    if(paket == 'Premium'){
    connection.query("UPDATE user set paket=2 WHERE username='" + req.user.username + "'", function(err, rows, fields) 
        {
        });
    }
   else if(paket == 'Pertamax'){
    connection.query("UPDATE user set paket=3 WHERE username='" + req.user.username + "'", function(err, rows, fields) 
        {
        });
   }
   else{
    connection.query("UPDATE user set paket=1 WHERE username='" + req.user.username + "'", function(err, rows, fields) 
        {
        });
   }
   res.redirect('/billingA');
});

app.get('/invite',cekAutentikasi, function(req,res){
	console.log("hello");
	var mailOptions={
		to : req.query.to,
		subject : "Invitation From OPenVPN cloud Service",
		text : 'You have been invited by to use OpenVPN services Cloud Service. Download this Configuration File to use our services '+'/home/ripas/vpnClient/'+ req.user.username + '.ovpn', req.user.username + '.ovpn'
	}
	//console.log(to);
	console.log(mailOptions);
	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		res.end("error");
	 }else{
        	console.log("Message sent: " + response.message);
		res.end("sent");
    	 }
});
});

/*------------------------------------------------------------------------------------*/
/*------------------------------------POST--------------------------------------------*/

app.post('/home', passport.authenticate(
   'local', { successRedirect: '/dashboard', failureRedirect: '/home', failureFlash: false })
);

app.post('/register', function(req, res) {
    var nama = req.body.nama;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    
    
    connection.query("INSERT INTO user (nama, email, username, password, paket) VALUES ('" + nama + "','"+ email +"', '"+ username +"', '"+ password +"', '"+ 1 +"')", 
        function(err, rows, fields){});
    res.redirect('/home');
});

app.post('/newPassword', cekAutentikasi, function (req, res){
    var newPass = req.body.newPassword;
    var confPass = req.body.confPassword;
    if( newPass == confPass){
    connection.query("UPDATE user set password='" + newPass + "' WHERE username='" + req.user.username + "'", function(err, rows, fields) 
        {
  
        });
    }
    res.redirect('/dashboard');
});

app.post('/logout', function (req, res){
    if(req.isAuthenticated()){
       req.logout();
    }
    res.end('done');
});





/*------------------------------------------------------------------------------------*/
/*------------------------------------BACKEND-----------------------------------------*/
app.get('/app/create_user', cekAutentikasi, function(req, res) {
console.log('flag: '+global.flag);
    if(global.flag==1) {
    	var ps = child_process.spawn('ssh', ['ripas@10.151.32.101', 'bash /etc/openvpn/easy-rsa/CreateUser.sh.old ' + req.user.username]);
        global.flag = 2;
	console.log('membuat user di 10.151.32.101');
    }
    else {
	var ps = child_process.spawn('ssh', ['ripas@10.151.32.100', 'bash /etc/openvpn/easy-rsa/CreateUser.sh.old ' + req.user.username]);
	console.log('membuat user di 10.151.32.100');
        global.flag = 1;
}	
    ps.on('exit', function(code) {
        if(code == 0) {
            res.end('Sukses');
        } else {
            res.end('Gagal');

        }

    });

});

app.get('/downloadkey', function(req, res) {
    //sess = req.session;
    res.download('/home/ripas/vpnClient/'+ req.user.username + '.ovpn', req.user.username + '.ovpn');// Set disposition and send it.
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
