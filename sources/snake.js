/**
State: 
B - 开始界面
	触发: 页面刷新时初始状态(default B) || PO状态下点击退出按钮
	滚动条滚动true, 
	提示界面为 "游戏中空格键暂停" 选择难度, 开始按钮
	
S - 运行
	触发: B状态下点击开始按钮 || P状态下按空格键 || PO状态下点击重新开始按钮
	开启移动计时器, 
	滚动条滚动false, 
	B状态下 || 点击重新开始按钮 进入 提示界面为 闪烁的"按方向键移动"(启动闪烁计时器)
	其余状态下进入 无提示界面无提示
	
P - 暂停
	触发: S状态下按空格键
	删除移动计时器, 
	滚动条滚动false,
	提示界面为 "暂停中, 空格键继续" 重新开始按钮, 退出按钮
	
O - 挂了
	触发: 挂了
	删除移动计时器, 
	滚动条滚动false, 
	提示界面为 "挂了" 重新开始按钮, 退出按钮

按键
	空格键: 暂停 - S状态下, 继续 - P状态下
	方向键: S状态下, 如果"按方向键移动"闪烁则隐藏(停止闪烁计时器)

按钮
	开始: S, 初始化蛇和蛋
	重新: S, 初始化蛇和蛋
	结束: B, 初始化蛇和蛋

等级选择
	点击等级格: 如果是点亮的, 那么将后面点亮的关闭
		       如果是关闭的, 那么将前面关闭的点亮
	通过的灯决定等级, 共5个等级

线程执行
	判断碰撞 - 执行吃蛋 - 打印 - 执行移动
	当碰撞判断返回true, *那么不执行打印*, 并返回挂了
 */


// 界面
var div = null;
var infoB = null; // 准备界面
var infoPO = null; // 暂停结束界面
var infoPOText = null; // 暂停结束文字
var infoS = null; // 开始界面
var infoCp = null; // 版权界面, 在BPO时出现
var infoboxIns = null; // BPO界面框
var degreeBox = null; // 等级区
var scoreArea = null; // 显示分数区
// 蛇
var snake = null;
// 蛋
var egg = null;
// 移动的时间间隔
var moveInterval = 300;
// 移动时间间隔计时器id
var moveTimerId = null;
// 文字闪烁计时器id
var infoSId = null;

// 界面大小
var screenRow = 24; // screenHeight*=width
var screenCol = 35; // screenWidth*=width
// 控制按键时滚动条是否运动
var scrollMove = true;

// snakeNode, egg大小
var width = 15;
// head颜色
var headColor = "#13e9e8";
// body颜色
var bodyColor = "cyan";
// 初始长度
var length = 2;
// 等级1~5, 用于不同的计分
// 1: 1分, 2: 2分, 3: 3分, 4: 4分, 5: 5分
var degree = 0;
// 得分
var score = 0;

// 游戏状态
// B-准备开始 S-运行 P-暂停 O-挂了
var state = "B";

// 三个按钮
var startBt = null;
var quitBt = null;
var restartBt = null;

/**
 * 页面加载后执行
 */
window.onload = function() {

	// 界面
	div = document.getElementById("snakebox");
	div.style.cssText = "width:" + (screenCol * width) + ";height:"
			+ (screenRow * width) + ";";
	infoB = document.getElementById("infob");
	infoPO = document.getElementById("infopo");
	infoPOText = document.getElementById("infotext");
	infoS = document.getElementById("infos");
	infoCp = document.getElementById("infocp");
	infoBoxIns = document.getElementById("infobox");
	degreeBox = document.getElementById("radiosul");
	scoreArea = document.getElementById("score");
	
	
	// 隐藏infoPOS
	infoBox("B");

	// 三个按钮
	startBt = document.getElementById("start");
	quitBt = document.getElementById("quit");
	restartBt = document.getElementById("restart");

	// 按钮添加点击事件
	startBt.onclick = startGame;
	quitBt.onclick = quitGame;
	restartBt.onclick = restartGame;

	// 等级框添加点击事件
	degreeBox.onclick = degreeSelect;
	
	// 添加键盘事件
	var isKeyAvail = true;
	document.onkeydown = function(event) {
		// 按空格键
		if (event.keyCode == 32) {
			if (snake.nodes[0].dir != null) {
				if (state == "S") {
					// 执行暂停
					state = "P";
					// 删除计时器
					stopMoveTimer();
					// 滚动条滚动false
					scrollMove = false;
/*					// 判断boxSlideUpId和boxSlideDownId是否存在，如果存在需要先停止，否则会启动两个计时器导致窗口卡住
					boxSlideStop();*/
					// 显示提示框
					infoBox("P")
				} else if (state == "P") {
					// 执行运行
					state = "S";
					// 启动计时器
					startMoveTimer();
					// 滚动条滚动false
					scrollMove = false;
/*					// 判断boxSlideUpId和boxSlideDownId是否存在，如果存在需要先停止，否则会启动两个计时器导致窗口卡住
					boxSlideStop();*/
					// 隐藏提示框
					infoBox("PS");
				}
			}

			return scrollMove;
		}
		// 方向键
		else if (event.keyCode == 37 || event.keyCode == 38
				|| event.keyCode == 39 || event.keyCode == 40) {

			if (state == "S" && isKeyAvail) {

				// 按方向键开始运行时
				// 隐藏所有提示框
				infoBox();
				// 停止infos闪烁
				stopInfoFlicker();

				if (snake != null) {
					var head = snake.nodes[0];
				}
				switch (event.keyCode) {
				case 37:
					// div.innerHTML="left";
					if (head.dir != "R") {
						head.dir = "L";
					}
					break;
				case 38:
					// div.innerHTML="up";
					if (head.dir != "D") {
						head.dir = "U";
					}
					break;
				case 39:
					// div.innerHTML="right";
					if (head.dir != "L") {
						head.dir = "R";
					}
					break;
				case 40:
					// div.innerHTML="down";
					if (head.dir != "U") {
						head.dir = "D";
					}
					break;
				}

				// 锁定按键
				isKeyAvail = false;
				setTimeout(function() {
					isKeyAvail = true;
				}, (moveInterval - moveInterval / 4));

			} // if s keyavai

			return scrollMove;
		} // if 方向键

	} // function

	// 初始蛇, 按下方向键才会执行运动
	// 初始蛋
	initSnakeEgg();
	paint();
}

/**
 * 初始化蛇和蛋
 */
function initSnakeEgg() {
	snake = new Snake(240, 180, null, length);
	egg = new Egg("yellow");
}

/**
 * 初始化分数
 */
function scoreInit(scoreinit) {
	score = scoreinit;
	scoreArea.innerHTML = score;
}

/**
 * 开始游戏按钮方法 只有在B状态下才有开始
 */
function startGame() {
	if (state == "B") {
		
		// 获取难度等级
		degree = 0;
		var radios = document.getElementsByClassName("radio");
		for (var i = 0; i < radios.length; i++) {
			if (radios[i].className.indexOf(" select") >= 0) {
				degree ++;
			} else {
				break;
			}
		}

		moveInterval = (500 / degree).toFixed(0);

		// 进入运行状态
		state = "S";
		// 开启移动计时器
		startMoveTimer();
		// 滚动条滚动false
		scrollMove = false;
		// 隐藏所有提示界面, 并启动infos闪烁
		infoBox("S"); // 隐藏所有提示界面, 并启动infos闪烁
		//infoXHide(infoB);
		
		// score相关清零
		scoreInit(0);
	}
}

/**
 * 退出游戏按钮方法 PO状态下才能退出
 */
function quitGame() {
	if (state == "P" || state == "O") {

		// 初始蛇, 按下方向键才会执行运动
		// 初始蛋
		initSnakeEgg();
		paint();

		// 进入准备状态
		state = "B";
		// 滚动条滚动true
		scrollMove = true;
		infoBox("Q");

		// 将参数归位初始化
		// 创建初始的蛇, 按下方向键才会执行运动
		snake = new Snake(240, 180, null, length);
		// 其他状态, 如分数
		scoreInit(0);
	}
}

/**
 * 重新开始游戏方法 只有在PO状态下才可以重新开始
 */
function restartGame() {
	if (state == "P" || state == "O") {
		// 初始蛇, 按下方向键才会执行运动
		// 初始蛋
		initSnakeEgg();
		paint();

		// 进入运行状态
		state = "S";
		// 开启移动计时器
		startMoveTimer();
		// 滚动条滚动false
		scrollMove = false;
		// 隐藏所有提示界面, 并启动infos闪烁
		infoBox("RS"); // 隐藏所有提示界面, 并启动infos闪烁
		//infoXHide(infoPO);
		
		// 清零分数
		scoreInit(0);
	}
}


/**
 * 等级选择方法
 */
function degreeSelect(event) {
	var radioIntervalId = null;
	
	var classNameSelect = " select";
	var sourceBox = event.srcElement ? event.srcElement : event.target;

	if (sourceBox.className.indexOf(classNameSelect) >= 0) { // 说明点亮
		
		radioIntervalId = setInterval(function() {
			var next = sourceBox.nextElementSibling;
			//console.log(next);
			if (next == null || next.className.indexOf(classNameSelect) < 0) {
				clearInterval(radioIntervalId);
				radioIntervalId = null;
			} else {
				next.className = next.className.replace(classNameSelect, "");
				sourceBox = next;
			}
		}, 100);
	} else { // 说明关闭
		
		sourceBox.className += classNameSelect;
		
		radioIntervalId = setInterval(function() {
			var prev = sourceBox.previousElementSibling;
			//console.log(prev);
			if (prev == null || prev.className.indexOf(classNameSelect) >= 0) {
				clearInterval(radioIntervalId);
				radioIntervalId = null;
			} else {
				prev.className += classNameSelect;
				sourceBox = prev;
			}
		}, 200);
	} 
}
//为元素添加currentStyle属性来获取属性的值
/*HTMLElement.prototype.__defineGetter__("currentStyle", function () { 
	return this.ownerDocument.defaultView.getComputedStyle(this, null); 
});*/

/**
 * 1.1 - [infoBoxIns, infoCp展开]
 */
function infoXExtend(fun) {
	boxSlideDown(infoBoxIns, 4, 4, 5, fun);
	boxSlideUp(infoCp, 324, 1, 5);
}
/**
 * 1 - [infoX显示], [infoBoxIns, infoCp展开]
 */
function infoXShow(infoX, fun) {
	// 对于infoB和infoPO来说, 开始必须检测并设置为none
	if (infoX == infoB) {
		infoPO.style.display = "none";
	} else if (infoX == infoPO) {
		infoB.style.display = "none";
	}
	
	infoX.style.display = "block";
	infoXExtend(fun);
}

/**
 * 2.1 - [infoBoxIns, infoCp收缩]
 */
function infoXShrink(fun) {
	boxSlideUp(infoBoxIns, -220, 4, 5, fun);
	boxSlideDown(infoCp, 368, 1, 5);
}

/**
 * 2 - [infoBoxIns, infoCp收缩], [infoX隐藏]
 */
function infoXHide(fun) {
	infoXShrink(fun);
	// 只用收回去, 不用设置none, 在展开的时候会将所有设置为none, 并将该box为block
}

/**
 * 3 - infoBox向下走
 * infoBox: infoBoxIns, 4, 4, 1
 * infoCp: infoCp, 368, 1, 1
 */
var boxSlideUpId = null;
var boxSlideDownId = null;
function boxSlideDown(box, boundary, increment, time, fun) {
	var top;
	boxSlideDownId = setInterval(function(){
		top = box.offsetTop;
		if (top >= boundary) {
			clearInterval(boxSlideDownId);
			if (fun && typeof fun == "function") {
				fun();
			}
		} else {
			box.style.top = (top + increment) + "px";	
		}
	}, time);
}

/**
 * 4 - infoBox向上走
 * infoBox: infoBoxIns, -220, 4, 1
 * infoCp: infoCp, 324, 1, 1
 */
function boxSlideUp(box, boundary, increment, time, fun) {
	var top;
	boxSlideUpId = setInterval(function() {
		top = box.offsetTop;
		if (top <= boundary) {
			clearInterval(boxSlideUpId);
			// 如果showBox不为null, 那么说明需要调用紧接着的函数, 如果infoXShow(showBox)
			if (fun && typeof fun == "function") {
				fun();
			}
		} else {
			box.style.top = (top - increment) + "px";
		}
	}, time);
}

/**
 * infoX窗口停止滑动
 */
function boxSlideStop() {
	if (boxSlideUpId) {
		clearInterval(boxSlideUpId);
		boxSlideUpId = null;
	}
	if (boxSlideDownId) {
		clearInterval(boxSlideDownId);
		boxSlideDownId = null;
	}
}

/**
 * 显示隐藏提示框
 * 0 - 刚加载时, [infoB显示], [infoBoxIns, infoCp展开], [剩下的infoX隐藏](初始css全部设为none)
 * 1 - 点击开始游戏[infoBoxIns, infoCp收缩], [infoB隐藏], [infoS闪烁]
 * 2 - 点击重新开始[infoBoxIns, infoCp收缩], [infoPO隐藏], [infoS闪烁]
 * 3 - 点击退出游戏[infoBoxIns, infoCp收缩], [infoPO隐藏], [infoB显示], [infoBoxIns, infoCp展开]
 * 4 - 暂停, 挂了[infoPO显示], [infoBoxIns, infoCp展开]
 * 5 - 恢复[infoBoxIns, infoCp收缩], [infoPO隐藏]
 * 
 * 4个方法: 
 * 1 - [infoX显示], [infoBoxIns, infoCp展开]
 * 2 - [infoBoxIns, infoCp收缩], [infoX隐藏]
 * 3 - boxSlideUp(box,boundary,increment,time);
 * 4 - boxSlideDown(box,boundary,increment,time);
 */
function infoBox(action) {
	
	// infoBox收缩后要执行的函数
	var fun = function() {
		setTimeout(function(){
			infoXShow(infoB);
		}, 500);
	}
	
	if (action == "B") { // 准备界面
		infoXShow(infoB);
		
	} else if (action == "P" || state == "O") { // 暂停和挂了
		var ptextP = "<span>暂停中......</span><br><span class='smaller'>按 [<span>空格键</span>] 继续</span>";
		var ptextO = "<span>得分: " + score + "</span><br><span class='smaller'>挂了! 再接再厉!</span>";
		infoPOText.innerHTML = (state == "P" ? ptextP : ptextO);
		
		// 判断boxSlideUpId和boxSlideDownId是否存在，如果存在需要先停止，否则会启动两个计时器导致窗口卡住
		boxSlideStop();
		infoXShow(infoPO);
		
	} else if (action == "S") { // 点击开始游戏
		infoXHide();
		startInfoFlicker();
		
	} else if (action == "RS"){ // 点击重新开始
		infoXHide();
		startInfoFlicker();
		
	} else if (action == "PS"){ // 暂停后开始
		// 判断boxSlideUpId和boxSlideDownId是否存在，如果存在需要先停止，否则会启动两个计时器导致窗口卡住
		boxSlideStop();
		infoXHide();
		
	} else if (action == "Q") {
		infoXHide(fun);
	}
}

/**
 * 启动游戏运行计时器(移动计时器)
 */
function startMoveTimer() {
	if (moveTimerId == null) {
		// 将该计时器id赋值出来
		moveTimerId = setInterval(function() {
			run();
		}, moveInterval);
	}
}

/**
 * 删除游戏运行计时器(移动计时器)
 */
function stopMoveTimer() {
	if (moveTimerId != null) {
		// 删除计时器
		clearInterval(moveTimerId);
		moveTimerId = null;
	}
}

/**
 * 启动提示框闪烁计时器
 */
function startInfoFlicker() {
	if (infoSId == null) {
		infoSId = setInterval(function() {
			if (infoS.style.display == "block") {
				infoS.style.display = "none";
			} else {
				infoS.style.display = "block";
			}
		}, 500);
	}
}

/**
 * 停止提示框闪烁计时器
 */
function stopInfoFlicker() {
	if (infoSId != null) {
		clearInterval(infoSId);
		infoS.style.display = "none";
		infoSId = null;
	}
}

/**
 * 游戏运行时的执行任务 判断碰撞 - 执行吃蛋 - 打印 - 执行移动 当碰撞判断返回true, *那么不执行打印*, 并返回挂了
 */
function run() {

	// 碰撞检测
	var isHit = hitCheck();
	// 执行吃蛋
	eatEgg();
	// 打印
	if (!isHit) {
		paint();
	} else {
		// 进入挂了状态
		state = "O";
		// 删除移动计时器
		stopMoveTimer();
		// 滚动条滚动false
		scrollMove = false;
		// 显示提示框
		infoBox("O");
	}
	// 执行移动
	moveNext();
}

/**
 * 碰撞检测
 * 
 * @returns 碰上true 没碰上false
 */
function hitCheck() {
	return snake.hit();
}

/**
 * 吃蛋方法
 */
function eatEgg() {
	if (snake.hitEgg()) {
		snake.growLong();
		
		// 分数增长
		score += degree;
		scoreArea.innerHTML = score; 
		
		egg = new Egg("yellow");
	}
}

/**
 * snake移动后数据更改方法
 */
function moveNext() {
	snake.move();
}

/**
 * 打印画面方法
 */
function paint() {

	// 对DOM操作很耗费资源, 所以尽量减少对DOM的操作
	// 定义innerCnt, 将所有的innerHTML字符串用innerCnt保存,
	// 然后再操作DOM将innerCnt放入innerHTML
	var innerCnt = "";

	// 打印蛋
	var newEggDiv = "<div class='egg' " + "style='" + "width:" + width
			+ "px;height:" + width + "px;left:" + egg.x + "px;top:" + egg.y
			+ "px;background:" + egg.color + ";'></div>";
	innerCnt += newEggDiv;

	// 打印蛇
	for (var i = 0; i < snake.nodes.length; i++) {
		var node = snake.nodes[i];

		var newSnakeNodeDiv = "<div class='snakenode' " + "style='" + "width:"
				+ width + "px;height:" + width + "px;left:" + node.x
				+ "px;top:" + node.y + "px;background:" + node.color
				+ ";'></div>";
		innerCnt += newSnakeNodeDiv;
	}
	
	// 只对DOM进行一次操作
	div.innerHTML = innerCnt;
}

/**
 * snakeNode对象 dir: "U","R","D","L"
 */
function SnakeNode(x, y, dir, color) {
	// 坐标
	this.x = x;
	this.y = y;
	// 方向
	this.dir = dir;
	// 颜色
	this.color = color;

	// 运动方法
	this.move = function() {
		switch (this.dir) {
		case "U":
			this.y -= width;
			break;
		case "D":
			this.y += width;
			break;
		case "L":
			this.x -= width;
			break;
		case "R":
			this.x += width;
			break;
		}
	}
}

/**
 * snake对象
 */
function Snake(x, y, dir, len) {
	// nodes数组
	this.nodes = new Array();
	// 长长方法
	this.growLong = function() {
		var tail = this.nodes[this.nodes.length - 1];
		var dir = (tail.dir == null ? "L" : tail.dir);

		var newX;
		var newY;
		switch (dir) {
		case "U":
			newX = tail.x;
			newY = tail.y + width;
			break;
		case "D":
			newX = tail.x;
			newY = tail.y - width;
			break;
		case "L":
			newX = tail.x + width;
			newY = tail.y;
			break;
		case "R":
			newX = tail.x - width;
			newY = tail.y;
			break;
		}
		this.nodes.push(new SnakeNode(newX, newY, dir, bodyColor));
	}

	// 转向方法
	this.turnHead = function(dir) {
		this.nodes[0].dir = dir;
	}

	// 移动方法, 调用每个node的move方法
	this.move = function() {
		if (this.nodes[0].dir != null) {
			for (var i = this.nodes.length - 1; i >= 0; i--) {
				var node = this.nodes[i];
				node.move();
				if (i > 0) {
					node.dir = this.nodes[i - 1].dir;
				}
			}
		}
	}
	// 吃蛋方法
	this.hitEgg = function() {
		var head = this.nodes[0];
		if (head.x == egg.x && head.y == egg.y) {
			return true;
		}
		return false;
	}

	// 碰撞检测方法
	this.hit = function() {

		var head = this.nodes[0];

		// 碰自己
		for (var i = 1; i < this.nodes.length; i++) {
			var node = this.nodes[i];
			if (head.x == node.x && head.y == node.y) {
				return true;
			}
		}

		// 碰墙
		if (head.x < 0 || head.x > (screenCol - 1) * width || head.y < 0
				|| head.y > (screenRow - 1) * width) {
			return true;
		}

		return false;

	}

	// 根据参数初始化snake, 类似java类的构造方法执行的内容
	var head = new SnakeNode(x, y, dir, headColor);
	this.nodes.push(head);
	for (var i = 0; i < len - 1; i++) {
		this.growLong();
	}
}

/**
 * egg对象 随机出现在snakebox中 被吃后才重新生成第二个
 */
function Egg(color) {
	
	while (true) {
		var isEggInSnake = false;
		this.x = (Math.random() * (screenCol - 1)).toFixed(0) * width;
		this.y = (Math.random() * (screenRow - 1)).toFixed(0) * width;
		
		// 判断蛋没有在egg上
		for (var i = 0; i < snake.nodes.length; i++) {
			var node = snake.nodes[i];
			if (node.x == this.x && node.y == this.y) {
				isEggInSnake = true;
				break;
			}
		}
		
		// 符合情况
		if (!isEggInSnake)
			break;
	}
	
	this.color = color;
}