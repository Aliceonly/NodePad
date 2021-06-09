$('#enter').on('click', function () {
    debugger;
    const content = $('#content').val();
 
    if (!content) {
        alert('请输入评论!');
    }
 
    $.ajax({
        type: 'post',
        url: 'api/detail/:author/:_id',
        data: {
            content: content
        },
        dataType: 'json',
        success: function (result) {
            debugger;
            const comments = result.data.comments.reverse();
            $('#content').val('');
            let html = '';
            for (let i=0; i<comments.length; i++) {
                html+='<li><div><span class="fl">'+comments[i].username+'</span>' +
                    '<span class="fr">'+ transformTime(comments[i].	createTime) +'</span></div>' +
                    '<div>'+comments[i].content+'</div></li>';
            }
            $('#list').html(html);
        }
    })
})
 
 
function transformTime(time) {
    const d = new Date(time);
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日  ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
}