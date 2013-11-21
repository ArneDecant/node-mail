var Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require("fs");

var config = JSON.parse(fs.readFileSync("" + (process.cwd()) + "/config.json", "utf-8"));

var imap = new Imap({
    user: config.user,
    password: config.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

imap.once('ready', function () {
    openInbox(function (err, box) {
        if (err) {
            throw err;
        }
        // *:1 nieuwste emails eerst
            var f = imap.seq.fetch('*:1' , {
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                struct: true
            });
            f.on('message', function (msg, seqno) {
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function (stream, info) {
                    var buffer = '';
                    stream.on('data', function (chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function () {
                        console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    });
                });
                msg.once('attributes', function (attrs) {
                    console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                });
                msg.once('end', function () {
                    console.log(prefix + 'Finished');
                });
       
        
            });
        f.once('error', function (err) {
            console.log('[Error] Fetch error: ' + err);
        });
        f.once('end', function () {
            console.log('[Message] Fetched all messages from newest to oldest.');
            imap.end();
        });
    }); //openInbox
}); //Imap.once

imap.once('error', function (err) {
    console.log('[Error] ' + err);
});

imap.once('end', function () {
    console.log('[Message] Connection closed.');
});

imap.connect();