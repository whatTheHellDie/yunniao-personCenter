/*!
 * default v7.5.2: A lightweight front-end boilerplate
 * (c) 2017 
 * MIT License
 * https://github.com/whatTheHellDie/myDefault
 */

$(function(){
	//首页导航
	$(".s-nav li").click(function(){
		$(this).addClass("active").siblings().removeClass("active");
	});
	//侧边栏
	$("aside dt").click(function(){
		if(!$(this).siblings("dd").is(":visible")){
			$(this).siblings("dd").slideDown();
			$(this).children("i").addClass("icon-upjian").removeClass("icon-rjian");
		}else{
			$(this).siblings("dd").slideUp();
			$(this).children("i").addClass("icon-rjian").removeClass("icon-upjian");
		}
	});
});