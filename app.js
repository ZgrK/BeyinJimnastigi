var Twit   = require('twit');
var util   = require('util');
var config = require('./config.js');

var T = new Twit({
    consumer_key:         config.consumer_key
  , consumer_secret:      config.consumer_secret
  , access_token:         config.access_token
  , access_token_secret:  config.access_token_secret
})



// Application logic

var error_count = 0;
var current_answer;
var current_question;
var create_question = function() {
    var number_one   = ((Math.floor(Math.random() * 15000) + 1) % 200)+1;
    var number_two   = ((Math.floor(Math.random() * 15000) + 1) % 100)+1;
    var number_three = ((Math.floor(Math.random() * 15000) + 1) % 40)+1;
    var number_four  = ((Math.floor(Math.random() * 15000) + 1) % 60)+1;
    var number_five  = ((Math.floor(Math.random() * 15000) + 1) % 7)+2;

    if(number_two>number_one){
            var temp = number_one;
            number_one = number_two;
            number_two = temp;
    }
    var operation = Math.floor(Math.random()*6)+1;
    switch (operation) {
        case 1:
            question = util.format("%s+%s",number_one,number_two);
            break;
        case 2:
            question = util.format("%s*%s",number_one,number_five);
            break;
        case 3:
            question = util.format("%s-%s",number_one,number_two);
            break;
        case 4:
            question = util.format("%s+(%s*%s-%s)-%s",number_one,number_four,number_five,number_three,number_two);
            break;
        case 5:
            question = util.format("%s+(%s*%s)",number_four,number_three,number_five);
            break;
        case 6:
            question = util.format("%s*(%s-%s)",number_five,number_one,number_two);
            break;
    }

    current_question = question;
    current_answer   = eval(question);
    return question;
}
 
var send_question = function() {
    var question = create_question();
    T.post('statuses/update', { status: question+" kaç eder ?" }, function(err, data, response) {
      if(err) {
            error_count++;
            console.log(err);
                    if(error_count<30)  send_question();
      } else {
            console.log("Soru gonderildi :  " + question);
      }
    });
}
 
var correct_answer = function(tweet) {
    var sender = tweet.user.screen_name;
    var tweet_id = tweet.id_str;
    var reply_tweet = util.format("Tebrikler @%s doğru cevap verdin ! (%s) = %s",sender,current_question,current_answer);

    
    T.post('statuses/update', { in_reply_to_status_id : tweet_id, status:reply_tweet}, function(err, data, response) {
        if(err) console.log("Tweet gönderilirken bir hata oluştu !");
        else {
                console.log(sender+" isimli kullanici "+current_question+" sorusunu bildi - sonuc : " + current_answer);
        }
        send_question();
    });
       
}
 


// Application engine

send_question();
 
var stream = T.stream('statuses/filter', { track: '@'+config.username }); // hesabımıza gelen mentionları izlemek için bir stream başlatalım
 
stream.on('tweet', function (tweet) { // başlattığımız stream'e yeni tweet düştüğü zaman çalışacak event 
        var text = tweet.text;
        var notice = util.format("@%s : %s",tweet.user.screen_name,text);

        text = text.replace(/\D/g, ''); // gelen tweet'in sadece numerik halini alalım

        if(text==current_answer){ // sonuç doğru ise 
                correct_answer(tweet);
        }
})