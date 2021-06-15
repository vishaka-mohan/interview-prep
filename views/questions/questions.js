$(document).ready(function(){

  $('form').on('submit', function(){

      var option = $('form input');
      var newQues = {ques: ques.val()};

      $.ajax({
        type: 'POST',
        url: '/questions/new',
        data: newQues,
        success: function(data){   //receive data here
          //do something with the data via front-end framework
          //window.location.href = "/questions/new"; 
          //location.reload();
        }
      });

      return false;

  });

});