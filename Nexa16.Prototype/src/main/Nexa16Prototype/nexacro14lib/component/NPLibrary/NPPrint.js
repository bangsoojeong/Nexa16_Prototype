﻿/**
*  인트라넷 고도화[Lexpeed3]구축 사업
*
*  @MenuPath 
*  @FileName LIB_PRINT
*  @Creator 송원창
*  @CreateDate 2016.04.15 
*  @LastModifier 
*  @LastModifyDate 
*  @Version 1.0
*  @Outline PRINT 관련 공통 함수 모음 
*  @Desction
*		Print
*		============================= 포함기능 =============================
*		- 화면이 선택한 용지 너비를 벗어나는 경우 용지 너비에 맞도록 컴포넌트의 크기 및 위치를 조정하여 출력
*		- 화면이 선택한 용지 높이를 벗어나는 경우 페이지를 나누어 출력
*		- 컴포넌트에 출력 제외 옵션을 설정하여 출력에서 제외하는 기능
*		- 그리드 컴포넌트는 현재 화면에 보이는대로 출력하거나 스크롤에 의해 감춰진 영역까지 출력할 수 있는 옵션 제공
*		- 그리드 전체 출력 옵션 적용 시 특정 칼럼을 제외하고 출력할 수 있는 기능
*		- 그리드 전체 출력 시 높이가 늘어난 경우 그리드 하단에 위치한 컴포넌트들의 위치를 자동으로 조정하는 옵션
*		- 컨테이너형 컴포넌트(Div, Tabpage)에 연결된 화면을 포함한 출력 기능 제공
*		- 화면안에 특정 컴포넌트(Div, Tab) 컴포넌트만 출력할 수 있는 기능 제공
* 
* 
************** 소스 수정 이력 *************************************************
*    date          Modifier            Description
*******************************************************************************
*  2016.04.15      송원창             최초 생성
*******************************************************************************
*/

var LIB_PRINT = nexacro.Form.prototype;

// windows 표준 DPI
LIB_PRINT.DPI = 96;

// A열 (A0 ~ A10) 용지규격 (단위:mm)
LIB_PRINT.PAPER_SIZE_TYPE_A = [[841, 1189],
                              [594, 841],
                              [420, 594],
                              [297, 420],
                              [210, 297],
                              [148, 210],
                              [105, 148],
                              [74, 105],
                              [52, 74],
                              [37, 52],
                              [26, 37]];

// B열 (B0 ~ B10) 용지규격 (단위:mm)
LIB_PRINT.PAPER_SIZE_TYPE_B = [[1030, 1456],
                              [728, 1030],
                              [515, 728],
                              [364, 515],
                              [257, 364],
                              [182, 257],
                              [128, 182],
                              [91, 128],
                              [64, 91],
                              [46, 64],
                              [32, 45]];
						 
// 인쇄 페이지 설정 기본 여백 (단위:mm)
// 브라우저 인쇄 페이지 설정의 머릿글/바닥글 등을 제외했을 경우 적용될 값이다.
LIB_PRINT.PAPER_MARGIN = {
		"left" : 5,
		"top" : 5,
		"right" : 5,
		"bottom" : 5
};

// 화면 축소 여부 (너비 기준)
// true : 필요한 너비 만큼 비율로 전체 컴포넌트 크기/간격 축소 후 html 생성
// false : 컴포넌트 크기 변환없이 원본 크기의 html 생성
LIB_PRINT.USE_SCALE = true;

// 인쇄 시 페이지를 용지 폭에 맞출지 여부 (브라우저 style 지원여부)
// true : style에 zoom 코드 삽입
// false : style에 zoom 코드 없음
LIB_PRINT.USE_ZOOM = true;

// 출력 대상
LIB_PRINT.printTargetContainer;
	
/******************************************************************************
	Print Utility Function
******************************************************************************/

/**
 * millimeter 를 pixel 단위로 변환
 * @param {number} mm millimeter
 * @return {number} pixel
 */
LIB_PRINT.prt_mmToPixel = function(mm)
{
	return Math.round((this.DPI/25.4)*mm);
};

/**
 * (font) point 를 pixel 단위로 변환
 * @param {number} pt font point
 * @return {number} pixel
 */
LIB_PRINT.prt_pointToPixel = function(pt)
{
	return Math.round(pt * this.DPI/72);
};

/******************************************************************************
	Print Core Function
******************************************************************************/

/**
 * 대상을 출력한다.
 * @param {XComp} target 출력 대상 target (Form, Div, Tab)
 * @param {string=} title 제목
 * @param {string=} paper 용지종류 ("A4", "B3", ...)
 * @param {string=} orientation 용지방향 ("portrait", "landscape") 
 * @return {boolean} 출력여부
 */
LIB_PRINT.printPreView = function(target, title, paper, orientation)
{
	//Eco.Logger.startElapsed();
	
	// 대상 확인
	var compType = this.gfn_typeOf(target);
	if ( compType != "Form" && compType != "Div" && compType != "Tab" )
	{
		//Eco.Logger.error({message:"target is not a container", stack:true});
		trace("message target is not a container");
		return false;
	}
	
	// 대상 컨테이너 지정
	var targetContainer;
	if ( compType == "Tab" )
	{
		// Tab의 경우 현재 선택된 Tabpage 를 출력
		targetContainer = target.tabpages[target.tabindex];
	}
	else
	{
		targetContainer = target;
	}
	
	this.printTargetContainer = targetContainer;
	
	// 문서 제목 추출
	var titletext = (compType == "Form" ? targetContainer.titletext : targetContainer.text);
	title = this.gfn_isEmpty(title) ? titletext : title;
	if ( this.gfn_isEmpty(title) )
	{
		title = "제목없음";
	}
	
	// 출력 영역 픽셀 사이즈 구하기
	paper = this.gfn_isEmpty(paper) ? "A4" : paper;
	orientation = this.gfn_isEmpty(orientation) ? "portrait" : orientation;
	
	var printSize = this.prt_getAvailPixelSize(paper, orientation);
	if ( this.gfn_isNull(printSize) )
	{
		alert("입력 사이즈 ["+paper+"] : 용지 사이즈를 확인하시기 바랍니다.");
		return false;
	}
	
	// 스타일 값을 캐시 처리하기 위해 application 에 속성 추가
	var formPrintStyleCache = this.gfn_getUserProperty(application, "formPrintStyleCache");
	if ( this.gfn_isUndefined(formPrintStyleCache) )
	{
		formPrintStyleCache = {
			"border" : {},
			"font" : {},
			"cellLine" : {},
			"borderSize" : {}
		}; 
		this.gfn_setUserProperty(application, "formPrintStyleCache", formPrintStyleCache);
	}
	
	var html = this.prt_getPrintHTML(title, paper, orientation, printSize);
	
	//Eco.Logger.debug({message: "Generate HTML Tag !!", elapsed: true});
	trace("message: Generate HTML Tag !!");
	
	this.prt_executePreview(html);
	
	return true;
};

/**
 * 출력 html 을 반환한다.
 * @param {string} title 제목
 * @param {string} paper 용지종류 ("A4", "B3", ...)
 * @param {string} orientation 용지방향 ("portrait", "landscape") 
 * @param {array} printSize 출력영역 크기 ([width, height]) 
 * @return {string} html tag string
 */
LIB_PRINT.prt_getPrintHTML = function(title, paper, orientation, printSize)
{
	var targetContainer = this.printTargetContainer;
	
	// 출력 영역 확인
	var comp, comps = targetContainer.components;
		
	var hScrollMax = 0;
	if ( targetContainer.hscrollbar )
	{
		hScrollMax = targetContainer.hscrollbar.max;
	}
	
	var containerBorder = this.gfn_getBorderWidth(targetContainer);
	var containerWidth = 0;
	
	// 가장 큰 right 를 구한다.
	var len = comps.length;
	for (var i=0; i<len; i++)
	{
		comp = comps[i];
		
		if ( this.prt_isPrintableComp(comp) )
		{
			if ( containerWidth < comp.getOffsetRight() )
			{
				containerWidth = comp.getOffsetRight();
			}
		}
	}
	
	containerWidth -= (containerBorder[0] + containerBorder[2]);
	containerWidth += hScrollMax;
		
	var paperSize = this["PAPER_SIZE_TYPE_" + paper.charAt(0)][parseInt(paper.charAt(1))];
	var printWidth = printSize[0];
	var printHeight = printSize[1];

	var scale = 1;
	if ( this.USE_SCALE )
	{
		// 현재 Form이 출력 가능한 가로 영역을 벗어난 경우 scale 조정
		if ( containerWidth > printWidth )
		{
			scale = nexacro.round(printWidth/containerWidth, 2);
		}
	}

	// 그리드 세로 스크롤 제거 및 컴포넌트 위치 변경 정보 세팅
	this.prt_adjustCompPrintPosition(targetContainer, scale);	
	
	// html 생성
	var html = "";
	
	// script 치환 ID
	var scriptReplaceUid = this.gfn_getUniqueId("SCRLIB_PRINT");
	
	this.gfn_setUserProperty(targetContainer, "script", "");
	
	html += '<HTML>\n';
	html += '<HEAD>\n';
	html += '<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>\n';
	html += '<meta http-equiv="Content-Type" content="text/html;charset=utf-8">\n';
	html += '<style type="text/css">\n';
	
	html += '@page\n';
	html += '{\n';
	html += '	size: ' + paperSize[0] + 'mm ' + paperSize[1] + 'mm;\n';
	html += '	margin-left: '+this.PAPER_MARGIN.left+'mm;\n';
	html += '	margin-top: '+this.PAPER_MARGIN.top+'mm;\n';
	html += '	margin-right: '+this.PAPER_MARGIN.right+'mm;\n';
	html += '	margin-bottom: '+this.PAPER_MARGIN.bottom+'mm;\n';
	html += '}\n';

	html += '@media print\n';
	html += '{\n';
	    
	if ( this.USE_ZOOM )
	{
		html += '	zoom:100%;\n';
	}
	
	html += '}\n';

	html += '</style>\n';
	html +=	'<script type="text/javascript">\n';
	html += 'function fn_onload()\n';
	html += '{\n';
	html += scriptReplaceUid;
	html += '	self.setTimeout(function(){self.print(); self.close();}, 0);\n';
	html += '}\n';
	html +=	'</script>\n';
	html += '</HEAD>\n';
	html += '<BODY style="border:0px none #ffffff;" onload="fn_onload()">\n';

	var tag;
	var len = comps.length;
	for (var i=0; i<len; i++)
	{
		comp = comps[i];
		
		if ( this.prt_isPrintableComp(comp) )
		{
			tag = this.prt_getCompTagString(comp, scale, 1);

			html +=tag;
		}
	}

	html += '</BODY>\n';
	html += '</HTML>';
	
	// script 치환
	var script = this.gfn_getUserProperty(targetContainer, "script");
	if ( this.gfn_isEmpty(script) )
	{
		script = "";
	}
	
	html = html.replace(scriptReplaceUid, script);
		
	return html;
};

/**
 * 인쇄 미리보기를 실행한다.
 * @param {string} html 출력 html
 * @return {string} html tag string
 */
LIB_PRINT.prt_executePreview = function(html)
{	
	var targetContainer = this.printTargetContainer;

	// WebBrowser 컴포넌트
	var name = targetContainer.name + "_PrintWebBrowser";
	var wb = targetContainer.components[name];
	if ( this.gfn_isEmpty(wb) )
	{
		wb = new nexacro.WebBrowser(name, "absolute", 0, 0, 0, 0);
		wb.ignorePrint = "true";
		wb.set_visible(false);
		targetContainer.addChild(name, wb);
		wb.show();
		wb.set_url("about:blank");
		
		// FF 는 document.close 해도 로드가 완료되지 않는다.
		// url 이 about:blank 일 경우 onloadcompleated 이벤트 호출되지 않는다.
		// 이 경우 때문에 내부함수를 오버라이딩하여 사용한다.
		if ( nexacro.Browser == "Gecko" )
		{		
			wb.on_load_handler = function (docurl) {
				// this ==> WebBrowser Component
				nexacro.WebBrowser.prototype.on_load_handler.call(this, docurl);
				
				this.callMethod("printPreview", this._printHtml);
				this._printHtml = null;
			};
		}
	}
	
	var doc = wb.getProperty("document");
	if ( !doc._handle )
	{
		doc = wb.getProperty("contentDocument");
		if ( !doc._handle )
		{
			var win = wb.getProperty("contentWindow");
			doc = win.getProperty("document");
		}
	}
	
	// 크롬은 window.print() 로 인쇄미리보기가 실행된다.
	if ( nexacro.Browser == "Chrome" )
	{
		doc.callMethod("open");
		doc.callMethod("write", html);
		doc.callMethod("close");
	}
	else
	{
		// 미리보기가 안되는 브라우저(런타임포함)는 팝업으로
		// 생성된 html 을 보여주고 인쇄(window.print())를 실행한다.
		var l = system.clientToScreenX(application.mainframe, 0);
		var t = system.clientToScreenY(application.mainframe, 0);
		var w = targetContainer.getOffsetWidth();
		var h = targetContainer.getOffsetHeight();
		
		var popHtml = '<script type="text/javascript">\n';
		popHtml += 'function printPreview(html)\n';
		popHtml += '{\n';		
		popHtml += '	var printWin = window.open("", "printPreviewPop", "left='+l+', top='+t+', width='+w+', height='+h+'");\n';		
		popHtml += '	printWin.document.open();\n';
		popHtml += '	printWin.document.write(html);\n';
		popHtml += '	printWin.document.title = "인쇄미리보기";\n';
		popHtml += '	printWin.document.close();\n';
		popHtml += '}\n';
		popHtml += '</script>\n';
		
		doc.callMethod("open");
		doc.callMethod("write", popHtml);
		doc.callMethod("close");
		
		if ( nexacro.Browser == "Gecko" )
		{
			// FF 의 경우 on_load_handler overriding 함수에서 처리
			wb._printHtml = html;
		}
		else
		{
			wb.callMethod("printPreview", html);
		}
	}
};

/**
 * 지정된 용지크기와 방향에 유효한 픽셀 사이즈 구하기
 * @param {string} paper 용지종류 ("A4", "B3", ...)
 * @param {string} orientation 용지방향 ("portrait", "landscape", ...)
 * @return {array} 출력 가능한 픽셀 사이즈 ([width, height] or null)
 */
LIB_PRINT.prt_getAvailPixelSize = function(paper, orientation)
{
	var paperType = paper.charAt(0);
	var paperSize = parseInt(paper.charAt(1));
	
	if ( !this.gfn_isNumber(paperSize) || (paperSize < -1 || paperSize > 10) )
	{
		return null;
	}
	
	var size;
	if ( paperType == "A" )
	{
		size = this.PAPER_SIZE_TYPE_A[paperSize];
	}
	else if ( paperType == "B" )
	{
		size = this.PAPER_SIZE_TYPE_B[paperSize];
	}
	else
	{
		return null;
	}
	
	var width = this.prt_mmToPixel(size[0]);
	var height = this.prt_mmToPixel(size[1]);
	var marginWidth = this.prt_mmToPixel(this.PAPER_MARGIN.left)
	                + this.prt_mmToPixel(this.PAPER_MARGIN.right)
	                + this.prt_mmToPixel(2);
	var marginHeight = this.prt_mmToPixel(this.PAPER_MARGIN.top) 
					 + this.prt_mmToPixel(this.PAPER_MARGIN.bottom)
					 + this.prt_mmToPixel(2);
	
	if ( orientation == "portrait" )
	{
		width = width - marginWidth;
		height = height - marginHeight;
	}
	else if ( orientation == "landscape" )
	{
		width = height - marginWidth;
		height = width - marginHeight;	
	}
	else
	{
		return null;
	}
		
	return [width, height];
};

/**
 * 출력 대상 컴포넌트 여부 반환
 * @param {XComp} comp 컴포넌트
 * @return {boolean} 출력 대상 여부
 */
LIB_PRINT.prt_isPrintableComp = function(comp)
{	
	// 출력 제외 컴포넌트 (invisible)
	var compType = this.gfn_typeOf(comp);
	if ( compType == "PopupMenu" || compType == "PopupDiv" )
	{
		return false;
	}
	
	// visible 속성이 false 일 경우에도 printable = true 지정 시 출력 가능
	if ( comp.visible == false && comp.prinable != true )
	{
		return false;
	}
	
	// width 또는 height 가 0 일 경우 출력제외
	if ( comp.getOffsetWidth() == 0 || comp.getOffsetHeight() == 0 )
	{
		return false;
	}
	
	// 출력 제외 속성
	if ( ("ignorePrint" in comp) && comp.ignorePrint + '' == "true" )
	{
		return false;
	}
	
	return true;
};

/**
 * 컴포넌트의 position을 출력 가능한 크기로 변환하여 컴포넌트 속성으로 추가한다.
 * @param {XComp} comp 컴포넌트
 * @param {number} scale 스케일 조정 값
 */
LIB_PRINT.prt_setScalePrintPosition = function(comp, scale)
{
	var x, y, w, h;
		x = comp.getOffsetLeft();
		y = comp.getOffsetTop();
		w = comp.getOffsetWidth();
		h = comp.getOffsetHeight();
	
	if ( "currentstyle" in comp )
	{
		var border = this.gfn_getBorderWidth(comp);		
		w -= (border[0] + border[2]);
		h -= (border[1] + border[3]);
	}
	
	if ( scale < 1 )
	{
		x = Math.round(x * scale);
		y = Math.round(y * scale);
		w = Math.round(w * scale);
		h = Math.round(h * scale);
	}
	
	// 출력 위치 정보 속성 추가
	this.gfn_setUserProperty(comp, "scalePrintPosition", [x, y, w, h]);
};

/**
 * Grid 컴포넌트의 출력 정보를 생성한다.
 * @param {XComp} comp 컴포넌트
 * @param {number} scale 스케일 조정 값
 */
LIB_PRINT.prt_setGridPrintInfo = function(comp, scale)
{
	//var isEmptyFunc = this.gfn_isEmpty;
	var printAsShown = nexacro._toBoolean(comp.printAsShown);
	var bands = ["head", "body", "summ"];
	var band, size, bandRowIndex;
	var gridWidth = comp.getOffsetWidth();
	
	var noScrollGridHeight = 0;
	var headFormatRowSize = [];
	var bodyFormatRowSize = [];
	var summFormatRowSize = [];
	
	var bodyDataRowSize = [];

	var dataCount = comp.rowcount;
	var dataStartRow, dataEndRow;	
		
	var colCount = comp.getFormatColCount();
	var printColumnIndex = [];
	var printColumnSize = [];
	var printColumnScrollSize = [];
	var printColumnScrollClip = [];
	var formatRowCount = comp.getFormatRowCount();
		
	// 보이는대로 출력 ( 출력 제외 칼럼 속성은 무시함 )
	if ( printAsShown )
	{
		// 포맷 로우 사이즈 지정
		for (var i=0; i<formatRowCount; i++)
		{
			band = comp.getFormatRowProperty(i, "band");
			size = comp.getFormatRowProperty(i, "size");
			
			if ( scale < 1 )
			{
				size = Math.round(size * scale);
			}
			
			if ( band == "head" )
			{		
				headFormatRowSize.push(size);
			}
			else if ( band == "summ" )
			{
				summFormatRowSize.push(size);
			}
			else
			{
				bodyFormatRowSize.push(size);
			}
		}
		
		// left, right column band
		var colBand;
		var colLeftBandWidth = 0;
		var colRightBandWidth = 0;
		var colSizeOffset = [0];
		var columnLeft = [];
		for (var i=0; i<colCount; i++)
		{
			colBand = comp.getFormatColProperty(i, "band");
			if ( colBand == "left" )
			{
				colLeftBandWidth += comp.getRealColSize(i);
			}
			else if ( colBand == "right" )
			{
				colRightBandWidth += comp.getRealColSize(i);
			}
			colSizeOffset[i+1] = colSizeOffset[i] + comp.getRealColSize(i);
		}
		var colRightBandStart = 0;		
		if ( colRightBandWidth > 0 ) 
		{
			colRightBandStart = gridWidth - colRightBandWidth;
		}

		// 대상 컬럼 - 현재 보여지는 컬럼 찾기 (getCellRect 에 문제가 있음)
		var print;
		var colBand = "";
		var hScrollPos = comp.hscrollbar ? comp.hscrollbar.pos : 0;	
		for (var i=0; i<colCount; i++)
		{
			print = true;
			colBand = comp.getFormatColProperty(i, "band");
			
			if ( colBand == "body" )
			{
				// 그리드 너비 벗어남
				if ( (colSizeOffset[i+1] - hScrollPos ) >= gridWidth ) 
				{
					print = false;
				}
				//  왼쪽 숨김
				else if ( (colLeftBandWidth + hScrollPos) >= colSizeOffset[i+1] ) 
				{
					print = false;
				}
				//  오른쪽 숨김
				else if ( colRightBandWidth > 0 )
				{
					if ( colSizeOffset[i] - hScrollPos > colRightBandStart )
					{
						print = false;
					}
				}
			}
			
			if ( print )
			{
				size = comp.getRealColSize(i);
				if ( scale < 1 )
				{
					size = Math.round(size * scale);
				}
				printColumnSize.push(size);
				printColumnIndex.push(i);
				
				if ( colBand == "body" )
				{
					// left band 숨김 컬럼
					if ( (colLeftBandWidth + hScrollPos) > colSizeOffset[i] )
					{
						var tempSize = colLeftBandWidth + hScrollPos - colSizeOffset[i];
						if ( scale < 1 )
						{
							tempSize = Math.round(tempSize * scale);
						}	
						printColumnScrollSize.push(size - tempSize);
						printColumnScrollClip.push("left");
					}
					else if ( colRightBandWidth > 0 )
					{
						if ( (colSizeOffset[i] - hScrollPos) < colRightBandStart && (colSizeOffset[i+1] - hScrollPos) > colRightBandStart ) 
						{
							var tempSize = (colSizeOffset[i+1] - hScrollPos - colRightBandStart);
							if ( scale < 1 )
							{
								tempSize = Math.round(tempSize * scale);
							}
							printColumnScrollSize.push(size - tempSize);
							printColumnScrollClip.push("right");
						}
						else
						{
							printColumnScrollSize.push(size);
							printColumnScrollClip.push("");
						}
					}
					else
					{
						printColumnScrollSize.push(size);
						printColumnScrollClip.push("");
					}
				}
				else
				{
					printColumnScrollSize.push(size);
					printColumnScrollClip.push("");
				}
			}
		}

		// body data row
		var viewCount = dataCount - (comp.vscrollbar ? comp.vscrollbar.max : 0) + 1;
		dataStartRow = (comp.vscrollbar ? comp.vscrollbar.pos : 0);
		dataEndRow = dataStartRow + viewCount;
		
		if ( dataEndRow >= dataCount )
		{
			dataEndRow = (dataCount-1);
		}
		
		var arrLen;
		for (var i=dataStartRow; i<=dataEndRow; i++)
		{
			arrLen = bodyDataRowSize.push([]);
			for (var j=0,len=bodyFormatRowSize.length; j<len; j++)
			{
				size = comp.getRealRowSize(i, j);
				if ( scale < 1 )
				{
					size = Math.round(size * scale);
				}
				bodyDataRowSize[arrLen-1].push(size);
			}
		}
	}
	else
	{
		// 현재 그리드를 복사하여 출력 제외 칼럼을 적용하고
		// 복사된 그리드의 속성을 변경하여 모든 데이터가 
		// 출력되게 표시한 후 정보를 구성한다.
		var formats = comp.getCurFormatString();
		var compName = comp.name + "_FORPRINT";
		var printGrid = comp.parent.components[compName];	
		
		if ( this.gfn_isEmpty(printGrid) )
		{
			printGrid = new Grid();
			printGrid.init(compName, "absolute", 0, 0, comp.getOffsetWidth(), comp.getOffsetHeight());
			comp.parent.addChild(compName, printGrid);
			printGrid.ignorePrint = "true";
			printGrid.set_visible(false);
			printGrid.set_binddataset(comp.binddataset);
			printGrid.show();
		}

		// 원본 포맷 지정
		//printGrid.set_formats("<Formats><Format id=\"default\"></Format></Formats>"); // 2014,11,12 버전 에러 발생
		printGrid.set_formats("<Formats>" + formats + "</Formats>");	
		printGrid.set_enableredraw(false);

		// 출력 제외 칼럼
		var printIgnoreColumns = comp.printIgnoreColumns;
		if ( this.gfn_isEmpty(printIgnoreColumns) )
		{
			printIgnoreColumns = [];
		}
		else
		{
			printIgnoreColumns = printIgnoreColumns.split(",");
			
			// string -> number
			this.gfn_Each(printIgnoreColumns, function(name, index, array) {
				array[index] = parseInt(name, 10);
			});
			
			// 역 정렬
			printIgnoreColumns = printIgnoreColumns.sort(function(l, r){
				if ( l < r ) return 1;
				if ( l > r ) return -1;
				return 0;
			});
		}

		// 제외 칼럼 삭제
		for (var i=0,len=printIgnoreColumns.length; i<len; i++)
		{
			band = printGrid.getFormatColProperty(printIgnoreColumns[i], "band");
			printGrid.deleteContentsCol(band, printIgnoreColumns[i], false);
		}

		// wordwrap 적용
		var subcell;
		for (var i=0,len=bands.length; i<len; i++)
		{
			band = bands[i];
			cellCount = printGrid.getCellCount(band);			
			for (var j=0; j<cellCount; j++)
			{
				printGrid.setCellProperty(band, j, "wordwrap", "true");
				subcell = printGrid.getCellProperty(band, j, "subcell");
				for (var k=0; k<subcell; k++)
				{
					printGrid.setSubCellProperty(band, j, k, "wordwrap", "true");
				}
			}
		}

		printGrid.set_autofittype("col");
		printGrid.set_extendsizetype("row");
		printGrid.set_scrollbars("none");
		printGrid.set_summarytype(comp.summarytype);
		
		printGrid.set_enableredraw(true);

		// 원본 그리드에 참조 지정
		this.gfn_setUserProperty(comp, "printGrid", printGrid);
		
		colCount = printGrid.getFormatColCount();
		
		for (var i=0; i<colCount; i++)
		{
			size = printGrid.getRealColSize(i);
			if ( scale < 1 )
			{
				size = Math.round(size * scale);
			}
			printColumnSize.push(size);
			printColumnScrollSize.push(size);
			printColumnIndex.push(i);
			printColumnScrollClip.push("");
		}
		
		// head, summ ==> autoSizeRow 로 조정하여 기존보다 작으면 원복
		bands = ["head", "summ"];
		var bandIndex = 0;
		for (var i=0,len=bands.length; i<len; i++)
		{		
			band = bands[i];
			
			if ( band == "head" )
			{
				bandIndex = -1;
			}
			else if ( band == "summ" )
			{
				bandIndex = -2;
			}
			
			var formatRowSize = [];
			for (var j=0; j<formatRowCount; j++)
			{
				if ( band == printGrid.getFormatRowProperty(j, "band") )
				{
					size = printGrid.getFormatRowProperty(j, "size");
					formatRowSize.push(size);
				}
			}
			
			if ( formatRowSize.length == 0 ) continue;
			
			// text 크기에 맞게 행 높이 조절
			printGrid.set_autosizebandtype(band);
			printGrid.autoSizeRow("row", bandIndex);
			
			var checkRow = [];
			var row, rowspan, rowHeight;
			for (var j=0,len2=formatRowSize.length; j<len2; j++)
			{
				for (var k=0,len3=printGrid.getCellCount(band); k<len3; k++)
				{
					row = printGrid.getCellProperty(band, k, "row");
					rowspan = printGrid.getCellProperty(band, k, "rowspan");

					if ( j == row && rowspan == 1 )
					{
						if ( this.gfn_isEmpty(checkRow[row]) )
						{
							checkRow[row] = true;

							rowHeight = printGrid.getCellRect(bandIndex, k).height;			
							
							if ( formatRowSize[j] > rowHeight )
							{
								rowHeight = formatRowSize[j];
							}
							
							printGrid.setFormatRowProperty(row, "size", rowHeight);
							
							if ( scale < 1 )
							{
								rowHeight = Math.round(rowHeight * scale);
							}
							noScrollGridHeight += rowHeight;
												
							if ( band == "head" )
							{		
								headFormatRowSize.push(rowHeight);
							}
							else if ( band == "summ" )
							{
								summFormatRowSize.push(rowHeight);
							}										
						}
					}
				}
			}		
			
			// row 가 여러개인데 rowspan 만 존재할 경우
			// 전체 band 사이즈를 row 개수로 나눠서 지정
			if ( formatRowSize.length > 0 && checkRow.length == 0 )
			{
				rowHeight = Math.round(printGrid.getRealRowFullSize(band)/formatRowSize.length);
				
				for (var j=0,len2=formatRowSize.length; j<len2; j++)
				{
					if ( formatRowSize[j] > rowHeight )
					{
						rowHeight = formatRowSize[j];
					}
					
					printGrid.setFormatRowProperty(row, "size", rowHeight);
					
					if ( scale < 1 )
					{
						rowHeight = Math.round(rowHeight * scale);						
					}
					noScrollGridHeight += rowHeight;
										
					if ( band == "head" )
					{		
						headFormatRowSize.push(rowHeight);
					}
					else if ( band == "summ" )
					{
						summFormatRowSize.push(rowHeight);
					}
				}
			}
		}
		
		// body ==> 사이즈 자동 맞춤 후 기존보다 작으면 원복				
		dataStartRow = 0
		dataEndRow = dataCount-1;	
				
		// bodyFormatRowSize 는 scale 적용 사이즈
		var tempBodyFormatRowSize = [];
		for (var i=0; i<formatRowCount; i++)
		{
			band = printGrid.getFormatRowProperty(i, "band");
			size = printGrid.getFormatRowProperty(i, "size");
			if ( band == "body" )
			{
				tempBodyFormatRowSize.push(size);
				
				if ( scale < 1 )
				{
					size = Math.round(size * scale);
				}
				bodyFormatRowSize.push(size);
			}
		}
		
		printGrid.set_autosizebandtype("body");
		printGrid.set_autosizingtype("row");
		
		var arrLen;
		for (var i=dataStartRow; i<=dataEndRow; i++)
		{
			arrLen = bodyDataRowSize.push([]);
			for (var j=0,len=bodyFormatRowSize.length; j<len; j++)
			{
				size = printGrid.getRealRowSize(i, j);
				
				// 포맷 row 사이즈 보다 작아지면 포맷 row 사이즈 지정
				if ( size < tempBodyFormatRowSize[j] )
				{
					size = tempBodyFormatRowSize[j];
				}
				else
				{
					size += 2;
				}
				
				if ( scale < 1 )
				{
					size = Math.round(size * scale);	
				}
				
				noScrollGridHeight += size;
				bodyDataRowSize[arrLen-1].push(size);
			}
		}
	}

	var printInfo = {		
		'columnIndex': printColumnIndex,
		'columnSize': printColumnSize,
		'columnScrollSize': printColumnScrollSize,
		'columnScrollClip': printColumnScrollClip,
		'headFormatRowSize': headFormatRowSize,
		'bodyFormatRowSize': bodyFormatRowSize,
		'summFormatRowSize': summFormatRowSize,
		'bodyDataRowSize': bodyDataRowSize,
		'dataStartRow': dataStartRow,
		'dataEndRow': dataEndRow,
		'noScrollGridHeight': noScrollGridHeight
	};

	this.gfn_setUserProperty(comp, "printInfo", printInfo);
};

/**
 * 그리드의 모든 데이터가 보이게 크기를 설정하고
 * 컴포넌트 중 그리드의 bottom 보다 아래에 위치한 
 * 컴포넌트를 늘어난 그리드 높이만큼 이동시킬 위치를 설정한다.
 * @param {XComp} container 출력 대상
 * @param {number} scale 스케일 조정 값
 */
LIB_PRINT.prt_adjustCompPrintPosition = function(container, scale)
{	
	//var isEmptyFunc = this.gfn_isEmpty;
	//var typeOfFunc = this.gfn_typeOf;
	//var userPropFunc = this.gfn_setUserProperty;

	var comp, comps = container.components;
	var targetComps = [];
	for (var i=0,len=comps.length; i<len; i++)
	{
		comp = comps[i];

		if ( !this.prt_isPrintableComp(comp) ) continue;	
		
		// 정렬을 위한 속성 추가
		comp._sortPositionTop = comp.getOffsetTop();

		// scale 적용된 position 지정
		this.prt_setScalePrintPosition(comp, scale);
		
		targetComps.push(comp);
	}
	
	// top position으로 정렬
	var sortedComps = this.gfn_sortOn(targetComps, "_sortPositionTop");
	
	var type;
	var scrollGrid = [];	
	for (var i=0,len=sortedComps.length; i<len; i++)
	{
		comp = sortedComps[i];
		type = this.gfn_typeOf(comp);
		
		if ( type == "Grid" )
		{
			// 그리드 출력 정보 생성
			this.prt_setGridPrintInfo(comp, scale);
			
			// 모든 데이터 출력일 경우
			if ( comp.vscrollbar && nexacro._toBoolean(comp.printAsShown) != true )
			{
				var printInfo = this.gfn_getUserProperty(comp, "printInfo");
				var noScrollHeight = printInfo.noScrollGridHeight;
				var scalePrintPosition = this.gfn_getUserProperty(comp, "scalePrintPosition");
				var oldHeight = scalePrintPosition[3];
				
				if ( oldHeight < noScrollHeight )
				{
					scalePrintPosition[3] = noScrollHeight;
					
					this.gfn_setUserProperty(comp, "increment", true);
				}
				
				scrollGrid.push(comp);
			}
			else
			{
				this.gfn_setUserProperty(comp, "increment", false);
			}
		}
		else if ( type == "Div" )
		{
			this.prt_adjustCompPrintPosition(comp, scale);
		}
		else if ( type == "Tab" )
		{
			comp = comp.components[comp.tabindex];
			this.prt_adjustCompPrintPosition(comp, scale);
		}		
	}
	
	var bottomMax = 0;
	var grid, gridLeft, gridRight, gridTop, gridBottom, gridHeight;
	var compLeft, compRight, compTop, compBotttom, compHeight;
	var moveBottomCompGridWidth, moveTop;
	for (var i=0,len=scrollGrid.length; i<len; i++)
	{
		grid = scrollGrid[i];
		moveBottomCompGridWidth = nexacro._toBoolean(grid.moveBottomCompGridWidth);
		
		for (var j=0,len2=sortedComps.length; j<len2; j++)
		{
			comp = sortedComps[j];
			
			if ( this.gfn_isEmpty(this.gfn_getUserProperty(grid, "increment")) ) continue;
			
			if ( grid != comp )
			{
				var pos = this.gfn_getUserProperty(grid, "scalePrintPosition");
				gridLeft = pos[0];
				gridRight = gridLeft + pos[2];
				gridTop = pos[1];
				gridHeight = pos[3];
				gridBottom = gridTop + gridHeight;
				
				pos = this.gfn_getUserProperty(comp, "scalePrintPosition");
				compLeft = pos[0];
				compRight = compLeft + pos[2];
				compTop = pos[1];
				compHeight = pos[3];
				compBottom = compTop + compHeight;
				
				if ( grid.getOffsetTop() < comp.getOffsetTop() && grid.getOffsetBottom() < comp.getOffsetTop() )
				{
					moveTop = gridBottom + Math.round((comp.getOffsetTop() - grid.getOffsetBottom()) * scale);
					
					if ( moveTop > compTop )
					{
						if ( moveBottomCompGridWidth )
						{
							// 그리드 너비에 포함되는 컴포넌트만
							if ( gridLeft <= compLeft && compLeft <= gridRight )
							{
								this.gfn_getUserProperty(comp, "scalePrintPosition")[1] = moveTop;
							}
						}
						else
						{
							this.gfn_getUserProperty(comp, "scalePrintPosition")[1] = moveTop;
						}
					}
				}
			}
		}
	}
};

/**
 * Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getCompTagString = function(comp, scale, indent)
{
	var tag = "";
	var func = null;
	var type = this.gfn_typeOf(comp);

	switch(type)
	{
		case 'Plugin' :
		case 'FlashPlayer' :
			// 빈 영역 변환 함수
			func = this.prt_getEmptyCompTagString;
			break;
		case 'Button' :
		case 'Edit' :
		case 'FileDownload' :		
		case 'ImageViewer' :
		case 'MaskEdit' :
		case 'Static' :
		case 'Step' :
			// 기본 변환 함수
			func = this.prt_getBasicCompTagString;
			break;
		default :
			// 컴포넌트 개별 변환 함수
			func = this["prt_get"+type+"CompTagString"];
	}

	if ( typeof(func) == "function" )
	{
		tag = func.call(this, comp, scale, indent);
	}
	else
	{
		var funcName = "prt_get"+type+"CompTagString";
		//Eco.Logger.warn({message: funcName + " doesn't define !!", stack:true});
		trace("message: " + funcName + " doesn't define !!");
	}

	return tag;
};

/**
 * 빈 영역 변환 대상 Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getEmptyCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Basic Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getBasicCompTagString = function(comp, scale, indent)
{	
	var indentStr = this.gfn_repeatStr("	", indent);
	var indentStr2 = this.gfn_repeatStr("	", indent+1);
	
	var tag = indentStr;
	tag += "<div id=\""+ this.prt_getCompFullName(comp) +"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
	
	// image
	var compType = this.gfn_typeOf(comp);
	if ( compType == "Button" || compType == "ImageViewer" )
	{
		var imgElem = comp._img_elem;
		if ( imgElem )
		{
			var imageL = imgElem.left;
			var imageT = imgElem.top;
			var imageW = imgElem.width;
			var imageH = imgElem.height;
			
			if ( scale < 1 )
			{
				imageL = Math.round(imageL * scale);
				imageT = Math.round(imageT * scale);
				imageW = Math.round(imageW * scale);
				imageH = Math.round(imageH * scale);
			}		
			
			tag += indentStr2;
			tag += "<img style=\"position:absolute; left:"+imageL+"px; top:"+imageT+"px;";
			tag += " width:"+ imageW +"px; height:"+imageH+"px;\"";
			tag += " src=\"" + imgElem.imageurl + "\">\n";
		}
	}
	
	// padding
	var padding = this.gfn_getPadding(comp);
	var l = padding[0];
	var t = padding[1];
	var r = padding[2];
	var b = padding[3];

	if ( scale < 1 )
	{
		l = Math.round(l * scale);
		t = Math.round(t * scale);
		r = Math.round(r * scale);
		b = Math.round(b * scale);
	}

	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var paddingWidth = compPos[2] - (l+r);
	var paddingHeight = compPos[3] - (t+b);

	tag += indentStr2;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+l+"px;";
	tag += " top:"+t+"px;";
	tag += " width:"+ paddingWidth +"px;";
	tag += " height:"+ paddingHeight +"px;";
	tag += "\">\n";
	
	// text, align, font, color
	tag += this.prt_getTextWithAlignTagString(comp, scale, indent+2, paddingWidth, paddingHeight);
	
	tag += indentStr2 + "</div>\n";	// padding	
	tag += indentStr + "</div>\n";
		
	return tag;
};

/**
 * Calendar Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getCalendarCompTagString = function(comp, scale, indent)
{	
	var tag = "";
	var indentStr = this.gfn_repeatStr("	", indent);
	var compFullName = this.prt_getCompFullName(comp);
	
	tag = indentStr;
	tag += "<div id=\""+ compFullName +"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";	
		
	// 타입별로 display 가 틀리므로 분기처리
	var type = comp.type || "normal";	
	if ( type == "monthonly" )
	{
		var indentStr2 = this.gfn_repeatStr("	", indent+1);
		var indentStr3 = this.gfn_repeatStr("	", indent+2);
		var indentStr4 = this.gfn_repeatStr("	", indent+3);
		
		var popupcalendar = comp.popupcalendar;	// DatePickerControl
				
		// header : DatePickerHeader
		var header = popupcalendar._header;

		tag += indentStr2;
		tag += "<div id=\""+ compFullName +"_header\" style=\"";
		tag += this.prt_getPositionHtmlStyleByComp(header, scale);
		tag += this.prt_getBackgroundColorHtmlStyleByComp(header);
		tag += this.prt_getBorderHtmlStyleByComp(header);
		tag += this.prt_getBorderTypeHtmlStyleByComp(header);
		tag += "\">\n";
		
		// prevbutton, nextbutton, year, month
		tag += this.prt_getBasicCompTagString(header._prevButton, scale, indent+2);
		tag += this.prt_getBasicCompTagString(header._nextButton, scale, indent+2);
		tag += this.prt_getBasicCompTagString(header._yearStatic, scale, indent+2);
		tag += this.prt_getBasicCompTagString(header._monthStatic, scale, indent+2);

		tag += indentStr2 + "</div>\n";
				
		// body : DatePickerBody
		var item, items;
		var body = popupcalendar._body;
		
		tag += indentStr2;
		tag += "<div id=\""+ compFullName +"_body\" style=\"";
		tag += this.prt_getPositionHtmlStyleByComp(body, scale);
		tag += this.prt_getBackgroundColorHtmlStyleByComp(body);
		tag += this.prt_getBorderHtmlStyleByComp(body);
		tag += this.prt_getBorderTypeHtmlStyleByComp(body);
		tag += "\">\n";
		
		// week
		items = body._weeks;
		for (var i=0,len=items.length; i<len; i++)
		{
			item = items[i]; // StaticControl
			tag += this.prt_getBasicCompTagString(item, scale, indent+2);
		}

		// day
		items = body._days;
		for (var i=0,len=items.length; i<len; i++)
		{
			item = items[i]; // StaticControl 
			
			this.prt_setScalePrintPosition(item, scale);

			// getBasicCompTagString 로 StaticControl 출력 시 보이는데로 출력되지 않는다.
			var background = item.on_find_CurrentStyle_background("normal");
			if ( background == null )
			{
				background = popupcalendar.on_find_CurrentStyle_trailingdaybackground("normal");
			}
			
			var border = item.on_find_CurrentStyle_border("normal");
			if ( border == null )
			{
				border = popupcalendar.on_find_CurrentStyle_trailingdayborder("normal");
			}
			
			var bordertype = item.on_find_CurrentStyle_bordertype("normal");
			if ( bordertype == null )
			{
				bordertype = popupcalendar.on_find_CurrentStyle_trailingdaybordertype("normal");
			}
			
			var color = item.on_find_CurrentStyle_color("normal");
			if ( color == null )
			{
				color = popupcalendar.on_find_CurrentStyle_trailingdaycolor("normal");
			}
			
			var font = item.on_find_CurrentStyle_font("normal");
			if ( font == null )
			{
				font = popupcalendar.on_find_CurrentStyle_trailingdayfont("normal");
			}

			tag += indentStr3;
			tag += "<div id=\""+compFullName+"_body_day"+i+"\" style=\"";
			tag += this.prt_getPositionHtmlStyleByComp(item, scale);
			tag += this.prt_getBackgroundColorHtmlStyle(background);
			tag += this.prt_getBorderHtmlStyle(border);
			tag += this.prt_getBorderTypeHtmlStyle(bordertype);
			tag += "\"/>\n";
			
			var scalePos = this.gfn_getUserProperty(item, "scalePrintPosition");
			
			tag += indentStr4;
			tag += "<div style=\"display:table-cell; width:"+scalePos[2]+"px; height:"+scalePos[3]+"px;";
			tag += this.prt_getColorHtmlStyle(color);	
			tag += this.prt_getFontHtmlStyle(font, scale);			
			tag += " text-align:center; vertical-align:middle;"; 
			tag += "\"/>" + item.text + "</div>\n";
			
			tag += indentStr3 + "</div>\n";
			
			this.gfn_deleteUserProperty(item, "scalePrintPosition");
		}
		
		tag += indentStr2 + "</div>\n";
	}
	else
	{	
		// background image
		tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);

		// calenadredit
		tag += this.prt_getBasicCompTagString(comp.calendaredit, scale, indent+1);
		
		if ( type == "spin" )
		{
			// spinupbutton
			tag += this.prt_getBasicCompTagString(comp.spinupbutton, scale, indent+1);
			
			// spindownbutton
			tag += this.prt_getBasicCompTagString(comp.spindownbutton, scale, indent+1);			
		}
		else
		{
			// dropbutton
			tag += this.prt_getBasicCompTagString(comp.dropbutton, scale, indent+1);
		}	
	}
	
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * CheckBox Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getCheckBoxCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
	
	// padding
	var padding = this.gfn_getPadding(comp);
	var l = padding[0];
	var t = padding[1];
	var r = padding[2];
	var b = padding[3];

	if ( scale < 1 )
	{
		l = Math.round(l * scale);
		t = Math.round(t * scale);
		r = Math.round(r * scale);
		b = Math.round(b * scale);
	}
		
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var paddingWidth = compPos[2] - (l+r);
	var paddingHeight = compPos[3] - (t+b);
	
	var indentStr2 = this.gfn_repeatStr("	", indent+1);
	tag += indentStr2;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+l+"px;";
	tag += " top:"+t+"px;";
	tag += " width:"+ paddingWidth +"px;";
	tag += " height:"+ paddingHeight +"px;";
	tag += "\">\n";
	
	// 버튼 위치
	var curStyle = comp.currentstyle;
	var buttonBackground = curStyle.buttonbackground;
	var buttonBackgroundImage = buttonBackground ? buttonBackground.image : "";
	
	var buttonWidth = (curStyle.buttonsize ? parseInt(curStyle.buttonsize.value) : 13);
	var buttonHeight = (curStyle.buttonsize ? parseInt(curStyle.buttonsize.value) : 13);

	if ( scale < 1 )
	{
		buttonWidth = Math.round(buttonWidth * scale);
		buttonHeight = Math.round(buttonHeight * scale);
	}
	
	// button align 체크
	var buttonAlign = curStyle.buttonalign;
	var halign = "left";
	var valign = "middle";
	
	if ( !this.gfn_isEmpty(buttonAlign) )
	{
		halign = buttonAlign.halign;
		valign = buttonAlign.valign;
	}
	if ( halign == "center" )
	{
		halign = "left";
	}
	
	// button, text 위치
	var textLeft =0, textTop = 0;
	var buttonLeft = 0, buttonTop = 0;
	
	if ( halign == "left" )
	{
		buttonLeft = 0;
		textLeft = buttonWidth;
	}
	else
	{
		textLeft = 0
		buttonLeft = paddingWidth - buttonWidth;
	}
	
	if ( valign == "middle" )
	{
		buttonTop = Math.round((paddingHeight  - buttonHeight)/2);
	}
	else if ( valign == "bottom" )
	{
		buttonTop = paddingHeight - buttonHeight;
	}
	else
	{
		buttonTop = 0;
	}
	
	// 선택 표시
	var checked = false;
	var trueValue = comp.truevalue;
	if ( this.gfn_isEmpty(trueValue) )
	{
		checked = comp.value;
	}
	else
	{
		checked = (trueValue == comp.value ? true : false);
	}
	
	// button 변환
	var indentStr3 = this.gfn_repeatStr("	", indent+2);
	tag += indentStr3;
	tag += "<div a='1' style=\"position:absolute; overflow:hidden;";
	tag += " left:"+buttonLeft+"px;";
	tag += " top:"+buttonTop+"px;";

	if ( this.gfn_isEmpty(buttonBackgroundImage) )
	{
		// 너비, 높이에서 border 를 제외
		var border = curStyle.buttonborder;		
		if ( !this.gfn_isEmpty(border) )
		{
			var borderWidth = this.prt_getBorderSize(border);
			
			l = borderWidth[0];
			t = borderWidth[1];
			r = borderWidth[2];
			b = borderWidth[3];
			
			buttonWidth -= (l + r);
			buttonHeight -= (t + b);
			
			tag += this.prt_getBackgroundColorHtmlStyle(curStyle.buttonbackground, curStyle.buttongradation); 
			tag += this.prt_getBorderHtmlStyle(border);
			tag += this.prt_getBorderTypeHtmlStyle(curStyle.buttonbordertype);	
		}
		
		tag += " width:"+ buttonWidth +"px;";
		tag += " height:"+ buttonHeight +"px;";
	}
	else
	{
		tag += " width:"+ buttonWidth +"px;";
		tag += " height:"+ buttonHeight +"px;";
		tag += " background-image:url('" + this.prt_getImageRealPath(buttonBackgroundImage) + "');";
		tag += " background-size: "+buttonWidth+ " " + buttonHeight + "px;";		
	}
		
	tag += "\"></div>\n";	// button
	
	if ( checked )
	{
		var imageUrl = (curStyle.buttonimage ? curStyle.buttonimage.value : "");		
		if ( !this.gfn_isEmpty(imageUrl) )
		{
			tag += indentStr3;
			tag += "<div style=\"position:absolute; overflow:hidden;";
			tag += " left:"+buttonLeft+"px;";
			tag += " top:"+buttonTop+"px;";
			tag += " width:"+ buttonWidth +"px;";
			tag += " height:"+ buttonHeight +"px;";
			tag += " background-image:url('" + this.prt_getImageRealPath(imageUrl) + "');";
			tag += " background-position: 50% 50%; background-repeat: no-repeat;";
			tag += " background-size: "+buttonWidth+ " " + buttonHeight + "px;";
			tag += "\"></div>\n";
		}
		else
		{
			tag += "<div style=\"display:table-cell; position:absolute; overflow:hidden;";
			tag += " left:"+buttonLeft+"px;";
			tag += " top:"+buttonTop+"px;";
			tag += " width:"+ buttonWidth +"px;";
			tag += " height:"+ buttonHeight +"px;";
			tag += this.prt_getFontHtmlStyleByComp(comp, scale);
			//tag += "\">√</div>\n";
			tag += "\">∨</div>\n";
		}
	}
	
	// text 변환
	var textWidth = (paddingWidth - buttonWidth);
	var textHeight = paddingHeight;

	// padding
	var textPadding = curStyle.textpadding;
	if ( !this.gfn_isEmpty(textPadding) )
	{
		var paddingSize = this.prt_getPaddingSize(curStyle.textpadding, scale);
		
		textLeft += paddingSize[0];
		textTop += paddingSize[1];
		textWidth -= (paddingSize[0] + paddingSize[2]);
		textHeight -= (paddingSize[1] + paddingSize[3]);
	}	
	
	var indentStr3 = this.gfn_repeatStr("	", indent+2);
	tag += indentStr3;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+textLeft+"px;";
	tag += " top:"+textTop+"px;";
	tag += " width:"+ textWidth +"px;";
	tag += " height:"+ textHeight +"px;";
	tag += "\">\n";
	
	tag += this.prt_getTextWithAlignTagString(comp, scale, indent+3, (paddingWidth - buttonWidth), paddingHeight);	
	tag += indentStr3 + "</div>\n";	// text
	
	tag += indentStr2 + "</div>\n";	// padding	
	tag += indentStr + "</div>\n";
		
	return tag;
};

/**
 * Combo Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getComboCompTagString = function(comp, scale, indent)
{	
	var tag = "";
	var indentStr = this.gfn_repeatStr("	", indent);
	
	tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
		
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);		

	// comboedit
	tag += this.prt_getBasicCompTagString(comp.comboedit, scale, indent+1);
	
	// dropbutton
	var dropbutton = comp.dropbutton;
	tag += this.prt_getBasicCompTagString(comp.dropbutton, scale, indent+1);

	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Div Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getDivCompTagString = function(comp, scale, indent)
{	
	var tag;	
	var indentStr = this.gfn_repeatStr("	", indent);
	
	tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";	
	
	// 현재 보이는 영역 정보
	var vScroll = comp.vscrollbar;
	var hScroll = comp.hscrollbar;
	var vScrollPos = vScroll ? vScroll.pos : 0;
	var hScrollPos = hScroll ? hScroll.pos : 0;
	var viewLeft = hScrollPos;
	var viewTop  = vScrollPos;
	var viewRight = hScroll ? comp.getOffsetWidth() + hScrollPos : comp.getOffsetWidth();
	var viewBottom = vScroll ? comp.getOffsetHeight() + vScrollPos : comp.getOffsetHeight();
	
	// 스크롤 보정값
	var scrollTop = 0, scrollLeft = 0;
	if ( viewTop > 0 )
	{
		scrollTop = Math.round( scale * viewTop );
	}
	if ( viewLeft > 0 )
	{	
		scrollLeft = Math.round( scale * viewLeft );
	}	
	
	var _comp, comps = comp.components;
	//var isEmptyFunc = this.gfn_isEmpty;
	var scalePrintPosition;
	for (var i=0,len=comps.length; i<len; i++)
	{
		_comp = comps[i];
		
		if ( !this.prt_isPrintableComp(_comp) ) continue;	
		
		// Div 스크롤 존재 시  현재 보이는 컴포넌트만 대상
		if ( comp.vscrollbar || comp.hscrollbar )
		{
			if ( _comp.getOffsetRight() > viewLeft && 
				 _comp.getOffsetLeft() < viewRight && 
				 _comp.getOffsetTop() < viewBottom &&
				 _comp.getOffsetBottom() > viewTop )
			{
				// 출력 위치 정보를 재구성하여 스크롤 값을 보정처리
				this.prt_setScalePrintPosition(_comp, scale);
				scalePrintPosition = this.gfn_getUserProperty(_comp, "scalePrintPosition");	
				scalePrintPosition[0] = scalePrintPosition[0] - scrollLeft;
				scalePrintPosition[1] = scalePrintPosition[1] - scrollTop;

				tag += this.prt_getCompTagString(_comp, scale, indent+1);
			}
		}
		else
		{
			tag += this.prt_getCompTagString(_comp, scale, indent+1);
		}
	}
	
	tag += indentStr + "</div>\n";
		
	return tag;
};

/**
 * FileUpload Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getFileUploadCompTagString = function(comp, scale, indent)
{
	var tag = "";	
	var indentStr = this.gfn_repeatStr("	", indent);
	var indentStr2 = this.gfn_repeatStr("	", indent+1);	
	var compFullName = this.prt_getCompFullName(comp);
	
	tag = indentStr;
	tag += "<div id=\""+compFullName+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
		
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);		

	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	
	var curStyle = comp.currentstyle;
	var buttonWidth = (curStyle.buttonsize ? parseInt(curStyle.buttonsize.value) : 0);	
	if ( this.gfn_isEmpty(buttonWidth) || buttonWidth < 0 )
	{
		buttonWidth = 18;
	}
	if ( scale < 1 )
	{
		buttonWidth = Math.round( scale * buttonWidth );
	}
		
	var itemHeight = (curStyle.itemheight ? parseInt(curStyle.itemheight.value) : 0);	
	if ( this.gfn_isEmpty(itemHeight) )
	{
		itemHeight = 18;
	}
	if ( scale < 1 )
	{
		itemHeight = Math.round( scale * itemHeight );
	}
	
	var editWidth = compPos[2] - buttonWidth;
	var fileItem, editComp, buttonComp;
	var itemCount = comp.itemcount;
	var itemTop = 0;
	
	for (var i=0; i<itemCount; i++)
	{
		fileItem = comp._items[i];
		
		// FileItem
		tag += indentStr2;
		tag += "<div id=\""+compFullName+"_"+fileItem.name+"\"";
		tag += " style=\"position:absolute; left:0px; top:"+itemTop+"px;";
		tag += " width:"+editWidth+"px; height:"+itemHeight+"px\">\n";
		
		// Edit 태그 생성
		editComp = fileItem.fileitemedit;
		
		this.prt_setScalePrintPosition(editComp, scale);
				
		tag += this.prt_getBasicCompTagString(editComp, scale, indent+2);
		
		this.gfn_deleteUserProperty(editComp, "scalePrintPosition");

		// Button 태그 생성
		buttonComp = fileItem.fileitembutton;
		
		this.prt_setScalePrintPosition(buttonComp, scale);
		
		this.gfn_deleteUserProperty(buttonComp, "scalePrintPosition");
				
		tag += this.prt_getBasicCompTagString(buttonComp, scale, indent+2);
		
		tag += indentStr2 + "</div>\n";
		
		itemTop += itemHeight;
	}
	
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Grid Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getGridCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);	
	var compFullName = this.prt_getCompFullName(comp);
	
	var tag = indentStr;	
	tag += "<div id=\""+compFullName+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += this.prt_getFontHtmlStyle(comp.currentstyle.font, scale);
	tag += this.prt_getColorHtmlStyle(comp.currentstyle.color);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);

	var bands = ["head"];
	
	if ( comp.summarytype.indexOf("top") > -1 )
	{
		bands.push("summ", "body");
	}
	else
	{
		bands.push("body", "summ");
	}
	
	// band
	for (var i=0,len=bands.length; i<len; i++)
	{
		tag += this.prt_getGridBandHtmlTagString(comp, bands[i], scale, indent+1);
	}
	
	tag += indentStr + "</div>\n";
	
	var printGrid = this.gfn_getUserProperty(comp, "printGrid");
	if ( this.gfn_isXComponent(printGrid) )
	{
		printGrid.set_autofittype("none");
		printGrid.set_autosizingtype("none");
		printGrid.set_extendsizetype("none");
		printGrid.set_scrollbars("none");
	}
		
	return tag;
};

/**
 * Grid Band -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {string} band 대상 band ('head', 'body', 'summ')
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getGridBandHtmlTagString = function(comp, band, scale, indent)
{
	var tag = "";
	var cellCount = comp.getCellCount(band);
	if ( cellCount > 0 )
	{
		var compFullName = this.prt_getCompFullName(comp);
		
		//var isEmptyFunc = this.gfn_isEmpty;
		//var arraySumFunc = this.gfn_sum;
		
		var indentStr = this.gfn_repeatStr("	", indent);
		var indentStr2 = this.gfn_repeatStr("	", indent+1);
		var indentStr3 = this.gfn_repeatStr("	", indent+2);
		var indentStr4 = this.gfn_repeatStr("	", indent+3);
		var indentStr5 = this.gfn_repeatStr("	", indent+4);
		var indentStr6 = this.gfn_repeatStr("	", indent+5);
		var indentStr7 = this.gfn_repeatStr("	", indent+6);
		
		var printInfo = this.gfn_getUserProperty(comp, "printInfo");
		var printColumnIndex = printInfo.columnIndex;
		var printColumnSize = printInfo.columnSize;
		var printColumnScrollSize = printInfo.columnScrollSize;
		var printColumnScrollClip = printInfo.columnScrollClip;
		var bandFormatRowSize = printInfo[band+"FormatRowSize"];
		var printDataStartRow = printInfo.dataStartRow;		
		var printDataEndRow = printInfo.dataEndRow;

		// 출력할 데이터 체크
		if ( band == "body" && printDataEndRow < 0 ) return "";
		
		// 모든 데이터 출력의 경우 출력용 그리드로 대체
		var gridProxy;
		var printAsShown = nexacro._toBoolean(comp.printAsShown);
		if ( printAsShown )
		{
			gridProxy = comp;
		}	
		else
		{
			gridProxy = this.gfn_getUserProperty(comp, "printGrid");
			cellCount = gridProxy.getCellCount(band);
		}		

		// band 영역 Tag (border, background)
		var gridBandInfo = gridProxy[band];
		var gridBand = gridBandInfo.bandctrl;
		
		var bandLeft = gridBand.getOffsetLeft();
		var bandTop = gridBand.getOffsetTop();
		var bandWidth = gridBand.getOffsetWidth();
		var bandHeight = gridBand.getOffsetHeight();

		if ( gridProxy.vscrollbar )
		{
			bandWidth += gridProxy.vscrollbar.getOffsetWidth();
		}
		if ( band == "body" && gridProxy.hscrollbar )
		{
			bandHeight += gridProxy.hscrollbar.getOffsetHeight();
		}
		if ( band == "summ" )
		{
			if ( comp.summarytype.indexOf("top") > -1 )
			{
				bandTop = gridProxy["head"].bandctrl.getOffsetTop() + gridProxy["head"].bandctrl.getOffsetBottom();
			}
			else
			{
				if ( !printAsShown )
				{
					var scalePrintPosition = this.gfn_getUserProperty(comp, "scalePrintPosition");
					bandTop = scalePrintPosition[3] - bandHeight;
				}
				
				if ( gridProxy.hscrollbar )
				{
					bandTop += gridProxy.hscrollbar.getOffsetHeight();
				}
			}
		}
		
		if ( scale < 1 )
		{
			bandLeft = Math.round(scale * bandLeft);
			bandTop = Math.round(scale * bandTop);
			bandWidth = Math.round(scale * bandWidth);
			bandHeight = Math.round(scale * bandHeight);
		}
		
		var background = gridBand.currentstyle.background;
		var gradation = gridBand.currentstyle.gradation;
		var border = gridBand.currentstyle.border;
		
		var borderSize = this.prt_getBorderSize(border);		
		var bandBorderWidth = borderSize[0] + borderSize[2];
		var bandBorderHeight = borderSize[1] + borderSize[3];
		
		tag += indentStr;
		tag += "<div id=\""+compFullName+"_"+band+"Band\"";
		tag += " style=\"position:absolute; overflow:hidden;";
		tag += " left:"+bandLeft+"px; top:"+bandTop+"px;";
		tag += " width:"+ (bandWidth-bandBorderWidth) +"px; height:"+ (bandHeight-bandBorderHeight) +"px;";
		tag += this.prt_getBackgroundColorHtmlStyle(background, gradation);
		tag += this.prt_getBorderHtmlStyle(border);
		tag += "\">\n";

		// suppress 용 tag 치환을 위해.. 
		// (table 보다 먼저 지정하지 않으면 출력 페이지 넘어갈 때 제대로 표시안됨)
		if ( band == "body" )
		{
			tag += "@" + compFullName + "_bodyBandSuppressTag";
		}
		
		// 테이블 생성
		tag += indentStr2;
		tag += "<table id=\""+compFullName+"_"+band+"Table\" style=\"";
		tag += " border-spacing:0;";
		tag += " border:0px none #ffffff;";
		tag += " padding:0px;";
		tag += " margin:0px;";
		tag += " border-collapse:separate;";
		tag += " table-layout:fixed;";
		tag += "\">\n";
		tag += indentStr3;
						
		if ( band == "body" )
		{
			tag += "<tbody valign=\"top\">\n";
		}
		else
		{
			tag += "<tbody>\n";
		}		
		
		// 칼럼정보 생성 (th 태그를 통해 동일 사이즈 유지)
		tag += indentStr4;
		tag += "<tr style=\"margin:0px; padding:0px; height:0px;\">\n";	

		for (var i=0,len=printColumnScrollSize.length; i<len; i++)
		{
			tag += indentStr5;
			tag += "<th style=\"width:"+printColumnScrollSize[i]+"px; height:0px;";
			tag += " margin:0px; padding:0px;\"></th>\n";
		}
		
		// td 높이 조절 및 빈 공간을 위한 dummy 생성
		tag += indentStr5;
		tag += "<th style=\"height:0px; margin:0px; padding:0px;\"></th>\n";
	
		tag += indentStr4 + "</tr>\n";
		
		// band cell 생성
		// body 의 경우 태그를 변환한 뒤 display 될 컨텐츠를 치환시킴
		var cellTag = "";
		var replaceId;
		var replaceUID = this.gfn_getUniqueId();
		var displaytype;
		var cellDisplayArgs = [];
		var bandRowIndex = this.gfn_decode(band, "head", -1, "summ", -2, 0);
		
		var row, col, colspan, rowspan, subcell, checkIndex, isSubCell;
		var displaytype, suppress, suppressalign, parentSuppress, suppressCells = [];
		var cellWidth, orgCellWidth, cellHeight, cellClip;
		var paddingWidth, paddingHeight;
		var arrayIndexof = this.gfn_indexOf;
		var cellAlign, cellHAlign, cellVAlign;
		var cellText, cellFont, cellLine, cellLineSize, checkCellLine, cellColor;
		var cellPadding, cellPaddingL, cellPaddingT, cellPaddingR, cellPaddingB;
		var cellBackground, cellGradation, checkBackground;
		var subLoopCount, noDrawDir;
		var decodeFunc = this.gfn_decode;

		// 출력 cell 정보 생성
		var cellMatrix = this.prt_getGridCellMatrix(gridProxy, band);
		var rowCells, cellInfo;
		var cellIndex, subCellIndex;
		var cellId;

		for (var formatRow=0,len=cellMatrix.length; formatRow<len; formatRow++)
		{
			cellTag +=  indentStr4;
			cellTag += "<tr style=\"margin:0px; padding:0px;\">\n";
			
			rowCells = cellMatrix[formatRow];
			for (var formatCol=0,len2=rowCells.length; formatCol<len2; formatCol++)
			{
				cellHeight = bandFormatRowSize[formatRow];
				
				cellInfo = rowCells[formatCol];
				
				if ( !cellInfo.draw ) continue;
				
				cellIndex = cellInfo.cellIndex;
				subCellIndex = cellInfo.subCellIndex;
												
				col = cellInfo.col;
				row = cellInfo.row;
				colspan = cellInfo.colspan;
				rowspan = cellInfo.rowspan;	
				subcell = cellInfo.subcell;
								
				checkIndex = arrayIndexof(printColumnIndex, col);
				
				if ( printAsShown )
				{
					if ( checkIndex < 0 ) continue;
				}
				
				cellClip = printColumnScrollClip[checkIndex];
				
				// subcell 이 존재하는 cell 이라면 
				if ( subcell > 0 )
				{
					colspan = 1;
					rowspan = 1;
					
					cellWidth = printColumnScrollSize[checkIndex];
					orgCellWidth = printColumnSize[checkIndex];
				}
				else
				{
					cellWidth = 0;
					orgCellWidth = 0;
					for (var i=0, index, size; i<colspan; i++)
					{
						index = arrayIndexof(printColumnIndex, col+i);							
						if ( index > -1 )
						{
							cellWidth += printColumnScrollSize[index];
							orgCellWidth += printColumnSize[index];
						}
					}
					
					// colspan 이 적용된 cell 에서 숨겨진 영역 제외
					if ( printAsShown && colspan > 1 )
					{
						var cnt = colspan;
						for (var i=0, index; i<cnt; i++)
						{
							index = arrayIndexof(printColumnIndex, col+i);
							if ( index < 0 )
							{
								colspan -= 1;
							}								
						}
					}
					if ( rowspan > 1 )
					{
						for (var i=1; i<rowspan; i++)
						{
							cellHeight += bandFormatRowSize[formatRow+i];
						}
					}
				}
				
				// suppress 정보 (body multi row 는 미지원)
				if ( band == "body" && len == 1 )
				{				
					displaytype = gridProxy.getCellProperty(band, cellIndex, "displaytype");
				
					if ( displaytype == "checkbox" || displaytype == "button" ||
						 displaytype == "bar" || displaytype == "tree" )
					{
					}
					else
					{
						parentSuppress = gridProxy.getCellProperty(band, cellIndex, "suppress");
						if ( subCellIndex > -1 )
						{
							suppress = gridProxy.getSubCellProperty(band, cellIndex, subCellIndex, "suppress");
							suppressalign = gridProxy.getSubCellProperty(band, cellIndex, subCellIndex, "suppressalign");
							displaytype = gridProxy.getSubCellProperty(band, cellIndex, subCellIndex, "displaytype");
						}
						else
						{
							suppress = gridProxy.getCellProperty(band, cellIndex, "suppress");
							suppressalign = gridProxy.getCellProperty(band, cellIndex, "suppressalign");
							displaytype = gridProxy.getCellProperty(band, cellIndex, "displaytype");
						}
																	
						if ( this.gfn_isEmpty(suppress) )
						{
							suppress = 0;
						}
					}
					
					// 상위 cell의 suppress가 없으면 subcell 도 적용하지 않음
					if ( parentSuppress > 0 && suppress > 0 )
					{
						if ( displaytype == "checkbox" || displaytype == "button" ||
							 displaytype == "bar" || displaytype == "tree" )
						{
						}
						else
						{
							suppressCells.push({
								'cellIndex': cellIndex, 
								'subCellIndex': (subCellIndex > -1 ? subCellIndex : -1), 
								'suppress': suppress,
								'suppressalign': suppressalign,
								'parentSuppress': parentSuppress
							});
						}
					}
				}
				
				if ( band == "body" )
				{
					checkBackground = "@CellBackground#" + formatRow + "_" + formatCol + "_" + replaceUID;
					checkCellLine = "@CellLine#" + formatRow + "_" + formatCol + "_" + replaceUID;
				}
				else
				{
					// subcell 이라도 cell 의 background, line 적용
					cellBackground = this.prt_getGridCellCurrentStyle(gridProxy, band, "background", 0, cellIndex, -1);
					cellGradation = this.prt_getGridCellCurrentStyle(gridProxy, band, "gradation", 0, cellIndex, -1);
					checkBackground = this.prt_getBackgroundColorHtmlStyle(cellBackground, cellGradation);
					
					cellLine = this.prt_getGridCellCurrentStyle(gridProxy, band, "border", 0, cellIndex, subCellIndex);
					cellLineSize = this.prt_getBorderSize(cellLine);

					cellWidth -= cellLineSize[0] + cellLineSize[2];
					cellHeight -= cellLineSize[1] + cellLineSize[3];
					
					orgCellWidth  -= cellLineSize[0] + cellLineSize[2];
				}
				
				if ( band == "body" )
				{
					cellId = compFullName + "_" + band + "_@ROW_INDEX_" + cellIndex + "_" + subCellIndex;					
				}
				else
				{
					cellId = compFullName + "_" + band + "_" + bandRowIndex + "_" + cellIndex + "_" + subCellIndex;
				}

				cellTag += indentStr5;
				cellTag += "<td id=\""+cellId+"\" style=\"overflow:hidden; margin:0px; padding:0px;\"";
				cellTag += " colspan=\""+colspan+"\"";
				cellTag += " rowspan=\""+rowspan+"\"";
				cellTag += ">\n";
								
				// background, border				
				cellTag += indentStr6;
				cellTag += "<div style=\"position:relative; left:0px; top:0px;";

				if ( band == "body" )
				{
					cellTag += "@CellPos#" + formatRow + "_" + formatCol + "_" + replaceUID;
					cellTag += checkCellLine;
				}
				else
				{
					cellTag += " width:"+cellWidth+"px; height:"+cellHeight+"px; ";
					
					noDrawDir = [];
					if ( subCellIndex > -1 )
					{
						if ( cellInfo.colspan > 1 && (cellInfo.colspan - cellInfo.subCellCol) > 1 )
						{
							noDrawDir.push("vertical");
						}
						if ( cellInfo.rowspan > 1 && (cellInfo.rowspan - cellInfo.subCellRow) > 1 )
						{
							noDrawDir.push("horizontal");
						}
						if ( !cellLine )
						{
							cellLine = this.prt_getGridCellCurrentStyle(gridProxy, band, "border", 0, cellIndex, -1);
						}							
					}
					cellTag += this.prt_getGridCellLineHtmlStyle(gridProxy, band, cellLine, noDrawDir);
				}
				
				cellTag += checkBackground;
				cellTag += "\">\n";
				
				// padding 영역
				cellTag += indentStr7;
				cellTag += "<div style=\"position:absolute;";
				
				if ( band == "body" )
				{
					replaceId = "#" + formatRow + "_" + formatCol + "_" + replaceUID;
					
					cellTag += " left:@CellPaddingLeft" + replaceId;
					cellTag += " top:@CellPaddingTop" + replaceId;
					cellTag += " width:@CellPaddingWidth" + replaceId;
					cellTag += " height:@CellPaddingHeight" + replaceId;				
				}
				else
				{
					cellPaddingL = 0;
					cellPaddingT = 0;
					cellPaddingR = 0;
					cellPaddingB = 0;
				
					cellPadding = this.prt_getGridCellCurrentStyle(gridProxy, band, "padding", 0, cellIndex, subCellIndex);
					if ( !this.gfn_isEmpty(cellPadding) )
					{
						var paddingSize = this.prt_getPaddingSize(cellPadding, scale);
						cellPaddingL = paddingSize[0];
						cellPaddingT = paddingSize[1];
						cellPaddingR = paddingSize[2];
						cellPaddingB = paddingSize[3];
					}
					
					paddingWidth = orgCellWidth - (cellPaddingL+cellPaddingR);
					paddingHeight = cellHeight - (cellPaddingT+cellPaddingB);
					
					if ( cellClip == "left" )
					{
						cellPaddingL -= (orgCellWidth - cellWidth);
					}
					
					cellTag += " left:" + cellPaddingL + "px;";
					cellTag += " top:" + cellPaddingT + "px;";
					cellTag += " width:" + paddingWidth + "px;";
					cellTag += " height:" + paddingHeight + "px;";
				}
				
				cellTag += "\">\n";
								
				if ( band == "body" )
				{
					cellTag += "@CellDisplay#" + formatRow + "_" + formatCol + "_" + replaceUID;
				}
				else
				{
					var args = {
						'cellIndex': cellIndex,
						'subCellIndex': subCellIndex,
						'width': paddingWidth,
						'height': paddingHeight,
						'dataRowIndex': 0
					};
					cellTag += this.prt_getCellDisplayTagString(gridProxy, band, scale, indent+7, args);
				}

				cellTag += indentStr7 + "</div>\n"; // padding	
				cellTag += indentStr6 + "</div>\n"; // background, border
				cellTag += indentStr5 + "</td>\n";			
				
			} // end for - formatCol
			
			// 행 높이 지정 ( 마지막에 붙여넣기 )
			if ( band == "body" )
			{
				cellHeight = "@BodyRowHeight#" + formatRow + "_" + replaceUID ;
			}
			else
			{
				cellHeight = bandFormatRowSize[formatRow];
			}
			
			cellTag += indentStr5;
			cellTag += "<td style=\"height:"+cellHeight+"px;";
			cellTag += " margin:0px; padding:0px;\"></td>\n";			
			
			cellTag += indentStr4 + "</tr>\n";			
			
		}	// end for - formatRow
		
		// head, summ band 는 바로 적용
		if ( band != "body" )
		{
			tag += cellTag;
		}
		
		// Body Band Cell 치환 및 suppress 적용
		if ( band == "body" )
		{
			var replaceTag, replaceStr, displayArgs;
			var dataRowIndex = 0;
			var bodyDataRowSize = printInfo.bodyDataRowSize;
			var cellRowSize;
			//var baindDataSet = this.gfn_lookup(gridProxy.parent, gridProxy.binddataset);
			var baindDataSet = gridProxy.getBindDataset();

			// data row count
			for (var dataRow=printDataStartRow; dataRow<=printDataEndRow; dataRow++)
			{
				replaceTag = cellTag;
				cellRowSize = bodyDataRowSize[dataRowIndex];
				
				// format row count
				for (var formatRow=0,len=cellMatrix.length; formatRow<len; formatRow++)
				{				
					rowCells = cellMatrix[formatRow];
					
					cellHeight = cellRowSize[formatRow];
					
					// 행 높이 치환
					replaceId = "@BodyRowHeight#" + formatRow + "_" + replaceUID;
					//replaceTag = replaceTag.replace(replaceId, cellHeight);
					
					// format col count
					for (var formatCol=0,len2=rowCells.length; formatCol<len2; formatCol++)
					{
						cellInfo = rowCells[formatCol];
						
						if ( !cellInfo.draw ) continue;
						
						cellIndex = cellInfo.cellIndex;
						subCellIndex = cellInfo.subCellIndex;
												
						cellHeight = cellRowSize[formatRow];
										
						col = cellInfo.col;
						row = cellInfo.row;
						colspan = cellInfo.colspan;
						rowspan = cellInfo.rowspan;	
						subcell = cellInfo.subcell;
						
						if ( rowspan > 1 )
						{
							for (var i=1; i<rowspan; i++)
							{
								cellHeight += cellRowSize[formatRow+i];
							}
						}
						
						checkIndex = arrayIndexof(printColumnIndex, col);
						
						if ( printAsShown )
						{
							if ( checkIndex < 0 ) continue;
						}
						
						cellClip = printColumnScrollClip[checkIndex];
						
						// subcell 이 존재하는 cell 이라면 
						if ( subcell > 0 )
						{
							cellWidth = printColumnScrollSize[checkIndex];
							orgCellWidth = printColumnSize[checkIndex];
						}
						else
						{
							cellWidth = 0;
							orgCellWidth = 0;
							for (var i=0, index, size; i<colspan; i++)
							{
								index = arrayIndexof(printColumnIndex, col+i);							
								if ( index > -1 )
								{
									cellWidth += printColumnScrollSize[index];
									orgCellWidth += printColumnSize[checkIndex];
								}
							}
						}
						
						// td id 치환
						replaceId = compFullName + "_" + band + "_@ROW_INDEX_" + cellIndex + "_" + subCellIndex;
						replaceStr = compFullName + "_" + band + "_" + dataRow + "_" + cellIndex + "_" + subCellIndex;
						replaceTag = replaceTag.replace(replaceId, replaceStr);	
						
						// background 치환	
						cellBackground = this.prt_getGridCellCurrentStyle(gridProxy, band, "background", dataRow, cellIndex, -1);
						cellGradation = this.prt_getGridCellCurrentStyle(gridProxy, band, "gradation", dataRow, cellIndex, -1);
						checkBackground = this.prt_getBackgroundColorHtmlStyle(cellBackground, cellGradation);						
						replaceStr = this.prt_getBackgroundColorHtmlStyle(cellBackground, cellGradation);
						
						replaceId = "@CellBackground#" + formatRow + "_" + formatCol + "_" + replaceUID;
						replaceTag = replaceTag.replace(replaceId, replaceStr);					
						
						if ( subCellIndex > -1 )
						{
							suppress = gridProxy.getSubCellProperty(band, cellIndex, subCellIndex, "suppress");
						}
						else
						{
							suppress = gridProxy.getCellProperty(band, cellIndex, "suppress");
						}
						
						if ( this.gfn_isEmpty(suppress) )
						{
							suppress = 0;
						}
												
						if ( suppress == 0 )
						{
							cellLine = this.prt_getGridSuppressBorder(gridProxy);
							
							cellLineSize = this.prt_getBorderSize(cellLine);
							cellWidth -= cellLineSize[0] + cellLineSize[2];
							cellHeight -= cellLineSize[1] + cellLineSize[3];
							
							orgCellWidth -= cellLineSize[0] + cellLineSize[2];
						}
						
						// position
						replaceId = "@CellPos#" + formatRow + "_" + formatCol + "_" + replaceUID;
						replaceStr = " width:"+cellWidth+"px; height:"+cellHeight+"px; ";
						replaceTag = replaceTag.replace(replaceId, replaceStr);
						
						// cellpadding
						cellPaddingL = 0;
						cellPaddingT = 0;
						cellPaddingR = 0;
						cellPaddingB = 0;
					
						cellPadding = this.prt_getGridCellCurrentStyle(gridProxy, band, "padding", dataRow, cellIndex, subCellIndex);
						if ( !this.gfn_isEmpty(cellPadding) )
						{
							var paddingSize = this.prt_getPaddingSize(cellPadding, scale);
							cellPaddingL = paddingSize[0];
							cellPaddingT = paddingSize[1];
							cellPaddingR = paddingSize[2];
							cellPaddingB = paddingSize[3];
						}
						
						if ( cellClip == "left" )
						{
							cellPaddingL -= (orgCellWidth - cellWidth);
						}
						
						paddingWidth = cellWidth - (cellPaddingL+cellPaddingR);
						paddingHeight = cellHeight - (cellPaddingT+cellPaddingB);

						replaceId = "#" + formatRow + "_" + formatCol + "_" + replaceUID;
						
						replaceStr = cellPaddingL + "px;";
						replaceTag = replaceTag.replace("@CellPaddingLeft" + replaceId, replaceStr);				
						
						replaceStr = cellPaddingT + "px;";
						replaceTag = replaceTag.replace("@CellPaddingTop" + replaceId, replaceStr);
							
						replaceStr = paddingWidth + "px;";
						replaceTag = replaceTag.replace("@CellPaddingWidth" + replaceId, replaceStr);
						
						replaceStr = paddingHeight + "px;";
						replaceTag = replaceTag.replace("@CellPaddingHeight" + replaceId, replaceStr);	
						
						// cellline 치환 - suppress 가 존재하면 개별 cell 의 
						// line 은 그리지 않고 병합된 cell 에 그린다.						
						if ( suppress > 0 && bandFormatRowSize.length == 1 )
						{
							replaceStr = "";
						}
						else
						{							
							noDrawDir = [];
							if ( subCellIndex > -1 )
							{
								if ( cellInfo.colspan > 1 && (cellInfo.colspan - cellInfo.subCellCol) > 1 )
								{
									noDrawDir.push("vertical");
								}
								if ( cellInfo.rowspan > 1 && (cellInfo.rowspan - cellInfo.subCellRow) > 1 )
								{
									noDrawDir.push("horizontal");
								}
							}
							replaceStr = this.prt_getGridCellLineHtmlStyle(gridProxy, band, cellLine, noDrawDir);
						}
						replaceTag = replaceTag.replace("@CellLine" + replaceId, replaceStr);
						
						// display 치환
						var args = {
							'cellIndex': cellIndex,
							'subCellIndex': subCellIndex,
							'width': paddingWidth,
							'height': paddingHeight,
							'dataRowIndex': dataRow
						};
						
						// 내용 치환 - suppress 가 존재하면 개별 cell 에
						// display 처리 하지않고 병합된 cell 에 그린다.						
						if ( suppress > 0 && bandFormatRowSize.length == 1 )
						{
							replaceStr = "";
						}
						else
						{
							replaceStr = this.prt_getCellDisplayTagString(gridProxy, band, scale, indent+7, args);
						}
						replaceTag = replaceTag.replace("@CellDisplay" + replaceId, replaceStr);								
						
					} // end for - format col count
					
				} // end for - format row count
				
				dataRowIndex += 1;
				
				tag += replaceTag;
				
			} // end for - data row count

			// suppress 분석
			var sortedSuppressCells = this.gfn_sortOn(suppressCells, "suppress", "cellIndex", "subCellIndex");			
			var prevValue, curValue;
			var suppressCellInfo, suppressInfo;
			var cellIndex, subCellIndex;
			var beforeCellInfo, beforeCellIndex
			var beforeSubcellIndex, beforeSuppress;
			var beforePrevValue, beforeCurValue;
			var checkPrevValue, checkCurValue;
			var sRow, eRow;
			var rowCount = gridProxy.rowcount;

			for (var i=0, len=sortedSuppressCells.length; i<len; i++)
			{
				suppressCellInfo = sortedSuppressCells[i];
				cellIndex = suppressCellInfo.cellIndex;
				subCellIndex = suppressCellInfo.subCellIndex;
				suppress = suppressCellInfo.suppress;
				parentSuppress = suppressCellInfo.parentSuppress;
				
				suppressInfo = suppressCellInfo.suppressInfo = [];

				sRow = 0;
				
				for (var r=0; r<rowCount; r++)
				{
					if ( subCellIndex == -1 )
					{	
						curValue = gridProxy.getCellText(r, cellIndex);
					}
					else
					{
						curValue = gridProxy.getSubCellText(r, cellIndex, subCellIndex);
					}
					
					if ( r == 0 ) 
					{
						prevValue = curValue;
					}
					else
					{
						if ( subCellIndex == -1 )
						{	
							prevValue = gridProxy.getCellText(r-1, cellIndex);
						}
						else
						{
							prevValue = gridProxy.getSubCellText(r-1, cellIndex, subCellIndex);
						}
					}
					
					checkPrevValue = prevValue;
					checkCurValue = curValue;
					
					// 이전 레벨의 값을 더해서 비교
					// (subcell 이면서 상위 cell 의 suppress 가 있다면 레벨값을 더하지 않음) 					
					if ( i > 0 )
					{
						if ( subCellIndex > 0 && parentSuppress > 0 )
						{
						}
						else
						{
							for (var j=0; j<i; j++)
							{
								beforeCellInfo = sortedSuppressCells[j];
								beforeCellIndex = beforeCellInfo.cellIndex;
								beforeSubcellIndex = beforeCellInfo.subCellIndex;
								beforeSuppress = beforeCellInfo.suppress;
								
								// 이전 레벨이 subcell 이라면 현재 cell 에 레벨값을 더하지 않음
								if ( beforeSubcellIndex > -1 ) break;
								
								if ( beforeSuppress < suppress )
								{
									if ( beforeSubcellIndex == -1 )
									{	
										beforeCurValue = gridProxy.getCellText(r, beforeCellIndex);
									}
									else
									{
										beforeCurValue = gridProxy.getSubCellText(r, beforeCellIndex, beforeSubcellIndex);
									}
									
									if ( r == 0 ) 
									{
										beforePrevValue = beforeCurValue;
									}
									else
									{
										if ( beforeSubcellIndex == -1 )
										{	
											beforePrevValue = gridProxy.getCellText(r-1, beforeCellIndex);
										}
										else
										{
											beforePrevValue = gridProxy.getSubCellText(r-1, beforeCellIndex, beforeSubcellIndex);
										}
									}
								}
							}
							
							checkPrevValue = beforePrevValue + checkPrevValue;
							checkCurValue = beforeCurValue + checkCurValue;
						}
					}
					
					if ( checkPrevValue != checkCurValue )
					{
						suppressInfo.push({
							'suppressStart': sRow, 
							'suppressEnd': (r-1), 
							'value': prevValue
						});
						sRow = r;
						
						// 마지막 row 체크
						if ( r == rowCount-1 )
						{
							suppressInfo.push({
								'suppressStart': sRow, 
								'suppressEnd': r, 
								'value': curValue
							});
						}
					}
					else
					{
						// 마지막 row 체크
						if ( r == rowCount-1 )
						{
							suppressInfo.push({
								'suppressStart': sRow, 
								'suppressEnd': r, 
								'value': curValue
							});
						}
					}					
				}
			}
			
			// suppress 적용
			var suppressTag = "";
			var info, check2Row;
			var suppressStart, suppressEnd;
			var drawStart, drawEnd;
			var suppressLeft = 0, suppressTop = 0, suppressWidth = 0, suppressHeight = 0;
			var cellRectLeft, cellRectTop, cellRectWidth, cellRectHeight;
			var displayContent = true;		
			var suppressCurCellTop = [];	
			var suppressCurSubCellTop = [];
			var tdId = "";
			var script = this.gfn_getUserProperty(this.printTargetContainer, "script");
			    script += "	var el, sEl, eEl;\n";

			for (var i=0, len=sortedSuppressCells.length; i<len; i++)
			{
				suppressCellInfo = sortedSuppressCells[i];

				cellIndex = suppressCellInfo.cellIndex;
				subCellIndex = suppressCellInfo.subCellIndex;
				suppress = suppressCellInfo.suppress;
				suppressalign = suppressCellInfo.suppressalign;
				suppressInfo = suppressCellInfo.suppressInfo;
				parentSuppress = suppressCellInfo.parentSuppress;

				if ( subCellIndex == -1 )
				{
					subCell = gridProxy.getCellProperty(band, cellIndex, "subcell");
				}
				else
				{
					// subcell 에 subcell 은 없다.
					subCell = 0;
				}
				
				if ( this.gfn_isEmpty(suppressalign) )
				{
					suppressalign = "first";
				}
				
				if ( this.gfn_isEmpty(suppressCurCellTop[cellIndex]) )
				{
					suppressCurCellTop[cellIndex] = 0;
				}
				
				if ( subCellIndex > -1 )
				{
					if ( this.gfn_isEmpty(suppressCurSubCellTop[cellIndex]) )
					{
						suppressCurSubCellTop[cellIndex] = [];
					}
					suppressCurSubCellTop[cellIndex][subCellIndex] = 0;
				}
				
				// left, width 구하기
				col = gridProxy.getCellProperty(band, cellIndex, "col");
				
				if ( subCellIndex > -1 )
				{
					col += subCellIndex;
				}
				
				checkIndex = arrayIndexof(printColumnIndex, col);
				
				suppressTop = 0;
				suppressLeft = 0;
				suppressWidth = printColumnScrollSize[checkIndex];
				suppressHeight = 0;
				
				for (var j=0; j<checkIndex; j++)
				{
					suppressLeft += printColumnScrollSize[j];
				}
				
				// subcell 인 경우 라인을 표시하지 않음
				cellLineSize = [0, 0, 0, 0];
				if ( subCellIndex == -1 )
				{
					cellLine = this.prt_getGridSuppressBorder(gridProxy);					
					cellLineSize = this.prt_getBorderSize(cellLine);
					
					suppressWidth -= cellLineSize[0] + cellLineSize[2];
				}

				// suppress 그리기
				for (var j=0, len2=suppressInfo.length; j<len2; j++)
				{
					cellId = compFullName + "_body_suppress_" + cellIndex + "_" + subCellIndex + "_"+ j;
					
					info = suppressInfo[j];
					suppressStart = info.suppressStart;
					suppressEnd = info.suppressEnd;

					// 스크롤되어 보이지 않는 경우
					if ( printAsShown )
					{
						if ( suppressEnd < printDataStartRow) continue;
						if ( suppressStart > printDataEndRow) continue;
					}

					if ( suppressStart < printDataStartRow )
					{
						drawStart = printDataStartRow;
					}
					else
					{
						drawStart = suppressStart;
					}
					
					if ( suppressEnd > printDataEndRow )
					{
						drawEnd = printDataEndRow;
					}
					else
					{
						drawEnd = suppressEnd;
					}

					if ( subCellIndex > -1 )
					{
						suppressTop = suppressCurSubCellTop[cellIndex][subCellIndex];
					}
					else
					{
						suppressTop = suppressCurCellTop[cellIndex];
					}
					
					suppressHeight = 0;
					for (var k=drawStart, tempSize; k<=drawEnd; k++)
					{
						tempSize = gridProxy.getRealRowSize(k);
						if ( scale < 1 )
						{
							tempSize = Math.round(tempSize * scale);
						}
						suppressHeight += tempSize;						
					}
					
					suppressHeight -= cellLineSize[1] + cellLineSize[3];
					
					if ( subCellIndex > -1 )
					{
						suppressCurSubCellTop[cellIndex][subCellIndex] += suppressHeight;
					}
					else
					{
						suppressCurCellTop[cellIndex] += suppressHeight;
					}
					
					// subcell 이면서 상위 cell 에 suppress 가 적용된 경우 
					// 상위 cell suppress 영역에 라인을 표시
					if ( subCellIndex == 0 && parentSuppress > 0 && suppress )
					{
						colspan = gridProxy.getCellProperty(band, cellIndex, "colspan");
						
						var cellSuppressWidth = 0;
						for (var k=0; k<colspan; k++)
						{
							cellSuppressWidth += printColumnScrollSize[checkIndex+k];
						}
						
						var cellSuppressHeight = bandHeight;
						
						cellLine = this.prt_getGridSuppressBorder(gridProxy);
						cellLineSize = this.prt_getBorderSize(cellLine);
						
						cellSuppressWidth -= cellLineSize[0] + cellLineSize[2];
						cellSuppressHeight -= cellLineSize[1] + cellLineSize[3];
						
						// script 를 통해 좌표 조정이 필요하다. (td 높이 합이 달라짐)
						tdId = compFullName + "_body_"+ drawStart +"_" + cellIndex + "_" + subCellIndex;	
						script += "	sEl = document.getElementById(\""+tdId+"\");\n";
						
						tdId = compFullName + "_body_"+ drawEnd +"_" + cellIndex + "_" + subCellIndex;					
						script += "	eEl = document.getElementById(\""+tdId+"\");\n";
						script += "	el = document.getElementById(\""+cellId+"\");\n";
						script += "	el.style.top = (sEl.offsetTop - "+(cellLineSize[1] + cellLineSize[3])+") + 'px';\n";
						script += "	el.style.height = (eEl.offsetTop + eEl.offsetHeight - sEl.offsetTop) + 'px';\n";
						script += "\n";

						suppressTag += indentStr2;
						suppressTag += "<div id=\""+ cellId +"\"";
						suppressTag += " style=\"position:absolute; overflow:hidden;";
						suppressTag += " left:"+suppressLeft+"px;";
						suppressTag += " top:0px;";
						suppressTag += " width:"+ cellSuppressWidth +"px;";
						suppressTag += " height:"+ cellSuppressHeight +"px;";
						suppressTag += this.prt_getGridCellLineHtmlStyle(gridProxy, "body", cellLine);
						suppressTag += "\">\n";
						suppressTag += indentStr2 + "</div>";
					}
					
					// script 를 통해 좌표 조정이 필요하다. (td 높이 합이 달라짐)
					tdId = compFullName + "_body_"+ drawStart +"_" + cellIndex + "_" + subCellIndex;
					script += "	sEl = document.getElementById(\""+tdId+"\");\n";
					
					tdId = compFullName + "_body_"+ drawEnd +"_" + cellIndex + "_" + subCellIndex;					
					script += "	eEl = document.getElementById(\""+tdId+"\");\n";
					script += "	el = document.getElementById(\""+cellId+"\");\n";
					script += "	el.style.top = (sEl.offsetTop - "+(cellLineSize[1] + cellLineSize[3])+") + 'px';\n";
					script += "	el.style.height = (eEl.offsetTop + eEl.offsetHeight - sEl.offsetTop) + 'px';\n";
					script += "\n";
					
					// suppress 영역
					suppressTag += indentStr2;
					suppressTag += "<div id=\""+cellId+"\"";
					suppressTag += " style=\"z-index:1; position:absolute; overflow:hidden;";
					suppressTag += " left:"+suppressLeft+"px;";
					suppressTag += " top:"+suppressTop+"px;";					
					suppressTag += " width:"+ suppressWidth +"px;";
					suppressTag += " height:"+ suppressHeight +"px;";
					
					// subcell 인 경우 라인을 표시하지 않음
					if ( subCellIndex == -1 )
					{
						suppressTag += this.prt_getGridCellLineHtmlStyle(gridProxy, "body", cellLine);
					}
					
					suppressTag += "\">\n";

					// 표시 영역
					if ( subCell > 0 )
					{
						// subcell 이 존재하면 cell 의 text가 지정되지 않으므로 출력안함
						displayContent = false;
					}
					else
					{
						displayContent = true;

						if ( suppressalign == "first" )
						{
							cellRectLeft = 0;
							cellRectTop = 0;
							cellRectWidth = suppressWidth;
							
							if ( printAsShown )
							{
								cellRectHeight = gridProxy.getRealRowSize(drawStart);
							}
							else
							{
								cellRectHeight = gridProxy.getRealRowSize(suppressStart);
							}
							
							if ( scale < 1 )
							{
								cellRectHeight = Math.round(cellRectHeight * scale);
							}
							
							check2Row = drawStart;
						}				
						else if ( suppressalign == "last" )
						{
							cellRectLeft = 0;
							cellRectWidth = suppressWidth;
														
							if ( printAsShown )
							{							
								cellRectHeight = gridProxy.getRealRowSize(drawEnd);
							}
							else
							{
								cellRectHeight = gridProxy.getRealRowSize(suppressEnd);
							}
							
							if ( scale < 1 )
							{
								cellRectHeight = Math.round(cellRectHeight * scale);
							}
											
							cellRectTop = suppressHeight - cellRectHeight;

							check2Row = drawEnd;
						}
						else if ( suppressalign == "middle" )
						{
							var count;
							var middleRow;
							var checkStart, checkEnd;
							if ( printAsShown )
							{
								checkStart = drawStart;
								checkEnd = drawEnd;
							}
							else
							{
								checkStart = suppressStart;
								checkEnd = suppressEnd;
							}		

							var count = (drawEnd - drawStart) + 1;
							var middleRow;
							if ( count == 1 )
							{
								middleRow = drawStart;
							}
							else
							{
								if ( count % 2 == 0 )
								{
									middleRow = checkStart + (count/2) - 1;
								}
								else
								{
									middleRow = checkStart + Math.floor(count/2);
								}
							}

							cellRectLeft = 0;
							cellRectTop = 0;
						
							for (var t=checkStart, tempSize; t<middleRow; t++ )
							{
								tempSize = gridProxy.getRealRowSize(t);
								if ( scale < 1 )
								{
									tempSize = Math.round(tempSize * scale);
								}								
								cellRectTop += tempSize;
							}
														
							cellRectWidth = suppressWidth;
							cellRectHeight = bodyDataRowSize[middleRow][0];
							
							if ( scale < 1 )
							{
								cellRectHeight = Math.round(cellRectHeight * scale);
							}

							check2Row = middleRow;
						}
						else if ( suppressalign.indexOf("over") > -1 )
						{
							cellRectLeft = 0;
							cellRectTop = 0;
							
							cellRectWidth = suppressWidth;
							cellRectHeight = suppressHeight;
							
							if ( suppressalign.indexOf("first") > -1 )
							{
								check2Row = drawStart;
							}
							else if ( suppressalign.indexOf("last") > -1 )
							{
								check2Row = drawEnd;
							}
							else
							{
								var count = (drawEnd - drawStart) + 1;
								var middleRow;
								if ( count == 1 )
								{
									middleRow = drawStart;
								}
								else
								{
									if ( count % 2 == 0 )
									{
										middleRow = drawStart + (count/2) - 1;
									}
									else
									{
										middleRow = drawStart + Math.floor(count/2);
									}
								}
								check2Row = drawEnd;
							}
						}
					} // end if - subCell Check Display

					// 내용 표시
					if ( displayContent )
					{
						suppressTag += indentStr3;
						suppressTag += "<div style=\"position:absolute; overflow:hidden;";
						suppressTag += " left:"+cellRectLeft+"px;";
						suppressTag += " top:"+cellRectTop+"px;";
						suppressTag += " width:"+ cellRectWidth +"px;";
						suppressTag += " height:"+ cellRectHeight +"px;";
						suppressTag += "\">\n";
						
						if ( subCellIndex > -1 )
						{
							displaytype = gridProxy.getSubCellProperty("body", cellIndex, subCellIndex, "displaytype");
						}						
						else
						{
							displaytype = gridProxy.getCellProperty("body", cellIndex, "displaytype");
						}
												
						if ( displaytype == "image" )
						{
							var url = info.value;
							var imageFullPath = this.prt_getImageRealPath(url);
							
							var posH = this.gfn_decode(cellHAlign, "center", "50%", "right", "100%", "0%");
							var posV = this.gfn_decode(cellVAlign, "middle", "50%", "bottom", "100%", "0%");
							
							suppressTag += indentStr4;
							suppressTag += "<div style=\"position:absolute; left:0px; top:0px;";
							suppressTag += " width:"+cellRectWidth+"px; height:"+cellRectHeight+"px;";
							suppressTag += " background-image:url('" + imageFullPath + "');";
							suppressTag += " background-repeat:no-repeat;";
							suppressTag += " background-position:" + posH + " " + posV + ";";	
							suppressTag += "\"></div>\n";
						}
						else
						{							
							var cellAlign = this.prt_getGridCellCurrentStyle(gridProxy, "body", "align", drawStart, cellIndex, subCellIndex);
							var cellHAlign, cellVAlign;
							
							if ( this.gfn_isEmpty(cellAlign) )
							{
								cellHAlign = "center";
								cellVAlign = "middle";
							}
							else
							{
								cellHAlign = cellAlign.halign;
								cellVAlign = cellAlign.valign;
							}						
							
							if ( suppressalign == "first,over" )
							{
								cellVAlign = "top";
							}		
							else if ( suppressalign == "middle,over" )
							{
								cellVAlign = "middle";
							}		
							else if ( suppressalign == "last,over" )
							{
								cellVAlign = "bottom";
							}
							
							var cellFont = this.prt_getGridCellCurrentStyle(gridProxy, "body", "font", drawStart, cellIndex, subCellIndex);						
							var cellColor = this.prt_getGridCellCurrentStyle(gridProxy, "body", "color", drawStart, cellIndex, subCellIndex);

							var cellWordWrap = "true";
							if ( !printAsShown )
							{
								cellWordWrap = this.prt_getGridCellCurrentProp(gridProxy, "body", "wordwrap", drawStart, cellIndex, subCellIndex);	
							}

							suppressTag += indentStr4;
							suppressTag += "<div style=\"display:table-cell;";
							suppressTag += " width:"+cellRectWidth+"px; height:"+cellRectHeight+"px;";
							suppressTag += " text-align:"+cellHAlign+"; vertical-align:"+cellVAlign+";";
							suppressTag += this.prt_getFontHtmlStyle(cellFont, scale);
							suppressTag += this.prt_getColorHtmlStyle(cellColor);
							suppressTag += this.prt_getWordWrapHtmlStyle(cellWordWrap);
							suppressTag += "\">";
							suppressTag += this.prt_replaceHtmlSpecialChar(info.value);
							suppressTag += "</div>\n";						
						}

						suppressTag += indentStr3 + "</div>\n";
						
					} // 내용표시
					
					suppressTag += indentStr2 + "</div>\n";
					
				} // end for - suppress 그리기
				
			} // end for - suppress 적용	
			
			// body band 보정 script ( 하단 보더 짤림)
			script += "	var bandEl = document.getElementById(\""+ (compFullName+"_bodyBand") +"\");\n";
			script += "	var tableEl = document.getElementById(\""+ (compFullName+"_bodyTable") +"\");\n";
			script += "	bandEl.style.height = tableEl.offsetHeight + 'px';\n\n";
			
			if ( band == "summ" && !printAsShown )
			{
				// summ band 보정
				script += "	var summBandEl = document.getElementById(\""+ (compFullName+"_summBand") +"\");\n";
				script += "	summBandEl.style.top = (bandEl.offsetTop + bandEl.offsetHeight) + 'px';\n\n";
			}
			
			// 컨테이너 script 추가
			this.gfn_setUserProperty(this.printTargetContainer, "script", script);			
			
			// suppress tag 치환
			tag = tag.replace("@" + compFullName + "_bodyBandSuppressTag", suppressTag);			

		} // end if ( band == "body" )
				
		tag += indentStr3 + "</tbody>\n";
		tag += indentStr2 + "</table>\n";
		tag += indentStr + "</div>\n";
		
	} // end if - cellcount > 0
	
	return tag;
};

/**
 * Grid cell 의 출력 정보를 구성하여 반환한다.
 * @param {XComp} grid 대상 Grid
 * @param {string} band 대상 band ('head' or 'body' or 'summ') 
 * @return {array} row, column 단위로 구성된 2차원 배열
*/
LIB_PRINT.prt_getGridCellMatrix = function(grid, band)
{
	var cellMatrix = [];
	var colCnt = grid.getFormatColCount();
	var rowCnt = grid.getFormatRowCount();	
	var columns;
	for (var i=0; i<rowCnt; i++)
	{
		if ( grid.getFormatRowProperty(i, "band") == band )
		{
			columns = [];
			for (var j=0; j<colCnt; j++)
			{
				columns.push(null);
			}
			cellMatrix.push(columns);
		}			
	}
	
	// cell 정보 생성 및 matrix 지정
	var col, row, colspan, rowspan, subcell;	
	var cellCnt = grid.getCellCount(band);
	var cellInfo;
	var subCellIndex = -1;
	for (var i=0; i<cellCnt; i++)
	{
		col = grid.getCellProperty(band, i, "col");
		row =  grid.getCellProperty(band, i, "row");
		colspan =  grid.getCellProperty(band, i, "colspan");
		rowspan =  grid.getCellProperty(band, i, "rowspan");
		subcell =  grid.getCellProperty(band, i, "subcell");
		
		subCellIndex = 0;
		
		for (var j=0; j<rowspan; j++)
		{		
			for (var k=0; k<colspan; k++)
			{				
				cellInfo = {'draw': true,
							'cellIndex': i,
							'col': col+k,
							'row': row+j, 
							'colspan': colspan, 
							'rowspan': rowspan,
							'subcell': subcell,
							'subCellIndex':-1,
							'subCellRow':j,
							'subCellCol':k
							};
				
				// 그리기 여부
				if ( ( j > 0 || k > 0) && subcell == 0 ) 
				{
					cellInfo.draw = false;
				}		
				
				if ( subcell > 0 )
				{
					cellInfo.subCellIndex = subCellIndex;
					subCellIndex += 1;
				}
				
				cellMatrix[row+j][col+k] = cellInfo;
			}
		}
	}
	
	return cellMatrix;
};

/**
 * 특정 cell 의 style 속성값을 반환
 * @param {Grid} grid 대상 Grid Component
 * @param {string} band 대상 band ('head' or 'body' or 'summ') 
 * @param {string} prop 찾을 속성
 * @param {number} row 대상 cell data row index (head:0, summ:0, body:0~n)
 * @param {number} cell 대상 cell index
 * @param {number=} subcell 대상 subcell index
 * @return {*} style 속성 값
*/
LIB_PRINT.prt_getGridCellCurrentStyle = function(grid, band, prop, row, cell, subcell)
{
	var format = grid._curFormat;
	var gridCellInfo = format["_"+band+"cells"][cell];
	var isSubCell = false;
	if ( this.gfn_isNumber(subcell) && subcell > -1 )
	{
		isSubCell = true;
	}
	var dataRow = (band == "body" ? row : 0);

	var ret = null;
	if ( prop == "background" && !isSubCell )
	{
		ret = gridCellInfo._query_pseudo_background(dataRow, (dataRow % 2), false, "normal");
	}
	else if ( prop == "border" && !isSubCell  )
	{
		var suppinfo = gridCellInfo._getSuppressInfo(dataRow, true);
		suppressborder = (suppinfo) ? suppinfo.border_proc : 0;
		
		if (row == grid.rowcount - 1)
		{
			suppressborder = 0;
		}
		ret = gridCellInfo._query_pseudo_border(dataRow, false, "normal", suppressborder);

	}
	else if ( prop == "gradation" && !isSubCell )
	{
		ret = gridCellInfo._query_pseudo_gradation(dataRow, (dataRow%2), false, "normal");
	}
	else if ( prop == "padding" )
	{
		if ( gridCellInfo._subcells.length > 0 )
		{
			ret = nexacro.Component._default_padding;
		}
		else
		{
			ret = gridCellInfo._query_pseudo_padding(dataRow, "normal");
		}
	}
	else if ( prop == "cursor" && !isSubCell )
	{
		ret = gridCellInfo._query_pseudo_cursor(dataRow, "normal");
	}
	else if ( prop == "font" )
	{
		ret = gridCellInfo._query_pseudo_font(dataRow, false, "normal");
	}
	else if ( prop == "color" )
	{
		ret = gridCellInfo._query_pseudo_color(dataRow, (dataRow%2), false, "normal");
	}
	else if ( prop == "align" )
	{
		ret = gridCellInfo._query_pseudo_align(dataRow, (dataRow%2), false, "normal");
	}
	
	return ret;
};

/**
 * suppress가 적용될 border style 속성값 반환
 * @param {Grid} grid 대상 Grid
 * @return {string} tag string
*/
LIB_PRINT.prt_getGridSuppressBorder = function(grid)
{
	// 실제 보여지는 항목을 반환하지 않고 대표를 하나 찾는다.
	return this.prt_getGridCellCurrentStyle(grid, "body", "border", grid.rowcount-1, 0)
};

/**
 * 특정 cell 의 속성값 반환
 * @param {XComp} grid 대상 Grid
 * @param {string} band 대상 band ('head' or 'body' or 'summ') 
 * @param {string} prop 찾을 속성
 * @param {number} cell 대상 cell index
 * @param {number=} subcell 대상 subcell index
 * @param {number=} cellRow 대상 cell row index (head:-1, sum:-2, body:0~n)
 * @return {string} tag string
*/
LIB_PRINT.prt_getGridCellCurrentProp = function(grid, band, prop, row, cell, subcell)
{
	var format = grid._curFormat;
	var dataRow = (band == "body" ? row : 0);		
	var gridCellInfo = format["_"+band+"cells"][cell];
	
	if ( this.gfn_isNumber(subcell) && subcell > -1 )
	{
		gridCellInfo = gridCellInfo._subcells[subcell];
	}
	
	var value;
	
	if ( prop == "wordwrap" )
	{
		value = gridCellInfo._getWordwrap(dataRow);
	}
	
	return value;
};

/**
 * cellline -> html style 변환.
 * @param {Grid} grid 대상 grid 컴포넌트
 * @param {string} band 대상 band ('head' or 'body' or 'summ') 
 * @param {object} cellline 대상 cellline object
 * @param {array} noDrawDir 그리기 제외 방향 ( 'vertical', 'horizontal' )
 * @return {string} tag string
*/
LIB_PRINT.prt_getGridCellLineHtmlStyle = function(grid, band, cellline, noDrawDir)
{
	var tag = "";
	//var isEmptyFunc = this.gfn_isEmpty;
	
	if ( this.gfn_isEmpty(noDrawDir) )
	{
		noDrawDir = [];
	}

	if ( this.gfn_isEmpty(cellline) )
	{
		return " border:0px none #ffffff;";
	}
	else
	{
		// check cache
		var cacheName = cellline.toString().replace(/\s/g, "_");
		
		cacheName += "_" + band + "_" + noDrawDir.join("_");
		if ( band == "summ" )
		{
			cacheName += "_" + grid.summarytype;
		}
		
		var cacheObj = this.gfn_getUserProperty(application, "formPrintStyleCache");
		tag = cacheObj.cellLine[cacheName];
		if ( !this.gfn_isUndefined(tag) )
		{
			return tag;
		}

		tag = "";
		
		var celllineStyle = cellline.style.valueOf();
		var celllineWidth = cellline.width.valueOf();
		var celllineColor = cellline.color.valueOf();
		var changeColor = "";

		// 1회 입력일 경우 
		if ( !this.gfn_isEmpty(celllineStyle) )
		{	
			var valign = "";
			if ( band == "summ" && grid.summarytype.indexOf("top") == -1 )
			{
				valign = "top";
			}
			else
			{
				valign = "bottom";
			}
			
			if ( this.gfn_indexOf(noDrawDir, "horizontal") == -1 )
			{	
				tag += " border-"+valign+"-style:"+celllineStyle+";";
				tag += " border-"+valign+"-width:"+celllineWidth+"px;";			
				if ( '#' == celllineColor.charAt(0) )
				{
					changeColor = celllineColor.substr(0,7);
				}
				else
				{
					changeColor = celllineColor;
				}
				tag += " border-"+valign+"-color:"+changeColor+";";
			}
			
			if ( this.gfn_indexOf(noDrawDir, "vertical") == -1 )
			{
				tag += " border-right-style:"+celllineStyle+";";
				tag += " border-right-width:"+celllineWidth+"px;";
				
				if ( '#' == celllineColor.charAt(0) )
				{
					changeColor = celllineColor.substr(0,7);
				}
				else
				{
					changeColor = celllineColor;
				}
				
				tag += " border-right-color:"+changeColor+";";
			}
		}
		else
		{
			var cellLineDir, cellLineDirs;
			
			if ( band == "summ" && grid.summarytype.indexOf("top") == -1 )
			{
				cellLineDirs = ["top", "right"];
			}
			else
			{
				cellLineDirs = ["bottom", "right"];
			}
			
			var checkCellLine, checkCellLineStyle, checkCellLineWidth, checkCellLineColor;
			
			for (var i=0,len=cellLineDirs.length; i<len; i++)
			{
				cellLineDir = cellLineDirs[i];
				
				if ( cellLineDir == "top" || cellLineDir == "bottom" )
				{
					if ( this.gfn_indexOf(noDrawDir, "horizontal") > -1 ) continue;
				}
				if ( cellLineDir == "left" || cellLineDir == "right" )
				{
					if ( this.gfn_indexOf(noDrawDir, "vertical") > -1 ) continue;
				}
				
				checkCellLineStyle = cellline[cellLineDir+"_style"];
				checkCellLineWidth = cellline[cellLineDir+"_width"];
				checkCellLineColor = cellline[cellLineDir+"_color"];
				
				tag += " border-"+cellLineDir+"-style:" + checkCellLineStyle + ";";
				tag += " border-"+cellLineDir+"-width:" + checkCellLineWidth + ";";
				
				if ( '#' == checkCellLineColor.charAt(0) )
				{
					tag += " border-"+cellLineDir+"-color:" + checkCellLineColor.substr(0,7) + ";";
				}
				else
				{
					tag += " border-"+cellLineDir+"-color:" + checkCellLineColor + ";";
				}							
			}
		}

		// cache 등록
		cacheObj.cellLine[cacheName] = tag;
	}

	return tag;
};

/**
 * Grid Cell displaytype 별 html tag 변환.
 * @param {object} args 변환 정보
 * @param {string} band 대상 band ('head' or 'body' or 'summ') 
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @param {object} args 변환 정보
 * @return {string} tag string
*/
LIB_PRINT.prt_getCellDisplayTagString = function(grid, band, scale, indent, args)
{
	var tag = "";
	var printAsShown = nexacro._toBoolean(grid.printAsShown);
	//var isEmptyFunc = this.gfn_isEmpty;
	var indentStr = this.gfn_repeatStr("	", indent);
	
	var cellIndex = args.cellIndex;
	var subCellIndex = args.subCellIndex;
	var isSubCell = (subCellIndex > -1 ? true : false);
	var bandRowIndex = this.gfn_decode(band, "head", -1, "summ", -2, 0);
	
	var width = args.width;
	var height = args.height;
	
	var format = grid._curFormat;
	var dataRow = (band == "body" ? args.dataRowIndex : 0);		
	var gridCellInfo = format["_"+band+"cells"][cellIndex];
	
	if ( isSubCell )
	{
		gridCellInfo = gridCellInfo._subcells[subCellIndex];
	}
	
	var displayType = gridCellInfo._getDisplaytype(dataRow);
	
	var cellAlign = this.prt_getGridCellCurrentStyle(grid, band, "align", dataRow, cellIndex, subCellIndex);
	var cellHAlign, cellVAlign;

	if ( this.gfn_isEmpty(cellAlign) )
	{
		cellHAlign = "center";
		cellVAlign = "middle";
	}
	else
	{
		cellHAlign = cellAlign.halign;
		cellVAlign = cellAlign.valign;
	}
	
	var cellFont = this.prt_getGridCellCurrentStyle(grid, band, "font", dataRow, cellIndex, subCellIndex);
	var cellColor = this.prt_getGridCellCurrentStyle(grid, band, "color", dataRow, cellIndex, subCellIndex);	
	var cellWordWrap = gridCellInfo._getWordwrap(dataRow);
	var cellText = gridCellInfo._getDisplayText(dataRow);

	// 변환	
	var useCache = (band == "body" ? true : false);
	
	// control 은 무조건 캐시 사용
	var controlCache = this.gfn_getUserProperty(grid, "cellDisplayControlCache");
	if ( this.gfn_isEmpty(controlCache) )
	{
		this.gfn_setUserProperty(grid, "cellDisplayControlCache", {});
		
		controlCache = this.gfn_getUserProperty(grid, "cellDisplayControlCache");
	}
	
	switch (displayType)
	{
		case 'bar' :			
			var progressbar = controlCache["ProgressBar"];
			if ( this.gfn_isEmpty(progressbar) )
			{
				progressbar = this.prt_getPrintFormProxyComp("ProgressBar");
				
				var controlStyle;
				var tempProgressBar;
				
				// destroy 될때가 있다.(bug ??)
				if ( grid.controlprogressbar )
				{
					controlStyle = grid.controlprogressbar.currentstyle;
				}
				else
				{
					tempProgressBar = new nexacro.GridControlBar("controlprogressbar", 0, 0, 0, 0, grid, true);
					controlStyle = tempProgressBar.currentstyle;					
				}
				
				if ( controlStyle.align )			progressbar.style.set_align(controlStyle.align._value);
				if ( controlStyle.background )		progressbar.style.set_background(controlStyle.background._value);
				if ( controlStyle.barcolor )		progressbar.style.set_barcolor(controlStyle.barcolor._value);
				if ( controlStyle.bargradation )	progressbar.style.set_bargradation(controlStyle.bargradation._value);
				if ( controlStyle.bartype )			progressbar.style.set_bartype(controlStyle.bartype._value);
				if ( controlStyle.border )			progressbar.style.set_border(controlStyle.border._value);
				if ( controlStyle.bordertype )		progressbar.style.set_bordertype(controlStyle.bordertype._value);
				if ( controlStyle.color )			progressbar.style.set_color(controlStyle.color._value);
				if ( controlStyle.direction )		progressbar.style.set_direction(controlStyle.direction._value);
				if ( controlStyle.endimage )		progressbar.style.set_endimage(controlStyle.endimage._value);
				if ( controlStyle.gradation )		progressbar.style.set_gradation(controlStyle.gradation._value);
				if ( controlStyle.padding )			progressbar.style.set_padding(controlStyle.padding._value);
				if ( controlStyle.progressimage )	progressbar.style.set_progressimage(controlStyle.progressimage._value);
				if ( controlStyle.smooth )			progressbar.style.set_smooth(controlStyle.smooth._value);
				if ( controlStyle.startimage )		progressbar.style.set_startimage(controlStyle.startimage._value);
				
				controlCache["ProgressBar"] = progressbar;
				
				if ( tempProgressBar )
				{
					tempProgressBar.destroy();
					tempProgressBar = null;
				}
			}
			
			progressbar.set_pos(cellText);
			progressbar.set_text(cellText);
			progressbar.move(0, 0, width, height);
			
			this.prt_setScalePrintPosition(progressbar, scale);
			
			tag = this.prt_getProgressBarCompTagString(progressbar, scale, indent);		
			break;
			
		case 'button' :			
			var button = controlCache["Button"];
			if ( this.gfn_isEmpty(button) )
			{
				button = this.prt_getPrintFormProxyComp("Button");
				
				var controlStyle;
				var tempButton;
				
				// destroy 될때가 있다.(bug ??)
				if ( grid.controlbutton )
				{
					controlStyle = grid.controlbutton.currentstyle;
				}
				else
				{
					tempButton = new nexacro.GridControlButton("controlbutton", 0, 0, 0, 0, grid, false, true);
					controlStyle = tempButton.currentstyle;					
				}
				
				if ( controlStyle.align )		button.style.set_align(controlStyle.align._value);
				if ( controlStyle.background )	button.style.set_background(controlStyle.background._value);
				if ( controlStyle.border )		button.style.set_border(controlStyle.border._value);
				if ( controlStyle.bordertype )	button.style.set_bordertype(controlStyle.bordertype._value);
				if ( controlStyle.gradation )	button.style.set_gradation(controlStyle.gradation._value);
				if ( controlStyle.image )		button.style.set_image(controlStyle.image._value);
				if ( controlStyle.imagealign )	button.style.set_imagealign(controlStyle.imagealign._value);
				if ( controlStyle.imagepadding )button.style.set_imagepadding(controlStyle.imagepadding._value);
				if ( controlStyle.padding )		button.style.set_padding(controlStyle.padding._value);
				
				controlCache["Button"] = button;
				
				if ( tempButton )
				{				
					tempButton.destroy();
					tempButton = null;
				}
			}

			button.set_text(cellText);
			button.move(0, 0, width, height);
			
			this.prt_setScalePrintPosition(button, scale);
			
			tag = this.prt_getBasicCompTagString(button, scale, indent);
			break;
			
		case 'checkbox' :
			var checkbox = controlCache["CheckBox"];
			if ( this.gfn_isEmpty(checkbox) )
			{
				checkbox = this.prt_getPrintFormProxyComp("CheckBox");
				
				var controlStyle;
				var tempCheckBox;
								
				// destroy 될때가 있다.(bug ??)
				if ( grid.controlcheckbox )
				{
					controlStyle = grid.controlcheckbox.currentstyle;
				}
				else
				{
					tempCheckBox = new nexacro.GridControlCheckbox("controlcheckbox", 0, 0, 0, 0, grid, true);
					controlStyle = tempCheckBox.currentstyle;					
				}
								
				if ( controlStyle.align )			checkbox.style.set_align(controlStyle.align._value);
				if ( controlStyle.background )		checkbox.style.set_background(controlStyle.background._value);
				if ( controlStyle.border )			checkbox.style.set_border(controlStyle.border._value);
				if ( controlStyle.buttonbackground )checkbox.style.set_buttonbackground(controlStyle.buttonbackground._value);
				if ( controlStyle.buttonimage )		checkbox.style.set_buttonimage(controlStyle.buttonimage._value);
				if ( controlStyle.buttonalign )		checkbox.style.set_buttonalign(controlStyle.buttonalign._value);
				if ( controlStyle.buttonsize )		checkbox.style.set_buttonsize(controlStyle.buttonsize._value);
				if ( controlStyle.gradation )		checkbox.style.set_gradation(controlStyle.gradation._value);
				if ( controlStyle.padding )			checkbox.style.set_padding(controlStyle.padding._value);

				controlCache["CheckBox"] = checkbox;
				
				if ( tempCheckBox )
				{					
					tempCheckBox.destroy();
					tempCheckBox = null;
				}
			}

			checkbox.set_value((cellText.toString()=="1" ? true : false));
			checkbox.set_text("");
			
			var buttonLeft = 0, buttonTop = 0;
			var buttonSize = (checkbox.currentstyle.buttonsize ? parseInt(checkbox.currentstyle.buttonsize._value) : 13);
			
			// 체크박스 컴포넌트는 center 가 없으므로 position으로 조정
			if ( cellHAlign == "center" )
			{
				buttonLeft = Math.round((width-buttonSize)/2);
			}
			else if ( cellHAlign == "right" )
			{
				buttonLeft =  width-buttonSize;
			}
			
			if ( cellVAlign == "middle" )
			{
				buttonTop = Math.round((height-buttonSize)/2);
			}
			else if ( cellVAlign == "bottom" )
			{
				buttonTop =  height-buttonSize;
			}
			
			var checkBoxTag;
			if ( useCache )
			{
				var checkBoxCache = this.gfn_getUserProperty(grid, "cellDisplayCheckBoxCache");
				if ( this.gfn_isEmpty(checkBoxCache) )
				{
					this.gfn_setUserProperty(grid, "cellDisplayCheckBoxCache", {});
					checkBoxCache = this.gfn_getUserProperty(grid, "cellDisplayCheckBoxCache");
				}
				
				// 캐시처리 key 생성				
				var cacheKey = width + "_" + height;
					cacheKey += "_" + buttonSize + "_" + checkbox.value;
				
				checkBoxTag = checkBoxCache[cacheKey];
				if ( !this.gfn_isEmpty(checkBoxTag) )
				{
					return checkBoxTag;
				}
			}
			
			checkbox.move(buttonLeft, buttonTop,buttonSize,buttonSize);
			
			this.prt_setScalePrintPosition(checkbox, scale);
			
			// CheckBox 태그 생성
			checkBoxTag = this.prt_getCheckBoxCompTagString(checkbox, scale, indent);
			
			// 캐시 등록
			if ( useCache )
			{
				checkBoxCache[cacheKey] = checkBoxTag;
			}
			
			tag = checkBoxTag;
			
			break;
			
		case 'image' :
			if ( this.gfn_isEmpty(cellText) )
			{
				return "";
			}
			
			var halign = this.gfn_decode(cellHAlign, "center", "50%", "right", "100%", "0%");
			var valign = this.gfn_decode(cellVAlign, "middle", "50%", "bottom", "100%", "0%");
			var imageFullPath = this.prt_getImageRealPath(cellText);
			
			tag += indentStr;
			tag += "<div style=\"position:absolute; overflow:hidden;";
			tag += " left:0px;";
			tag += " top:0px;";
			tag += " width:"+ width +"px;";
			tag += " height:"+ height +"px;";
			tag += " background-image:url('" + imageFullPath + "');";
			tag += " background-repeat:no-repeat;";
			tag += " background-position:"+halign+" "+valign+";";
			tag += "\"></div>\n";
			
			break;
		case 'none' :
			// 변환 없음
			break;	
		default :
			// text 지정
			if ( this.gfn_isEmpty(cellText) )
			{
				return "";
			}
			
			// 모든 데이터 출력 시 wordwrap 강제 적용
			if ( !printAsShown)
			{
				cellWordWrap = "true";
			}
			
			tag = indentStr;
			tag += "<div style=\"display:table-cell; width:"+width+"px; height:"+height+"px;";
			tag += " text-align:"+cellHAlign+"; vertical-align:"+cellVAlign+";";
			tag += this.prt_getFontHtmlStyle(cellFont, scale);
			tag += this.prt_getColorHtmlStyle(cellColor);
			tag += this.prt_getWordWrapHtmlStyle(cellWordWrap);
			tag += "\">";
			tag += this.prt_replaceHtmlSpecialChar(cellText);
			tag += "</div>\n";
	}
	
	return tag;
};

/**
 * GroupBox Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getGroupBoxCompTagString = function(comp, scale, indent)
{
	var compFullName = this.prt_getCompFullName(comp);
	var indentStr = this.gfn_repeatStr("	", indent);
	
	var tag = indentStr;
	tag += "<div id=\""+compFullName+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += "\">\n";
	
	// title 위치, 크기 구하기
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var titleAlign = comp.titlealign;
		titleAlign = this.gfn_isEmpty(titleAlign) ? "topleft" : titleAlign;
	
	// titleimage 크기
	var titleImage = comp.currentstyle.titleimage;
	var titleImageUrl = "";
	var titleImageWidth = 0;
	var titleImageHeight = 0;
	var titleImageSize = 0;

	if ( !this.gfn_isEmpty(titleImage) )
	{
		var imgElem = comp.titleButton._img_elem;
		if ( imgElem )
		{
			titleImageWidth = imgElem.width;
			titleImageHeight = imgElem.height;
			
			if ( scale < 1 )
			{
				titleImageWidth = Math.round(titleImageWidth * scale);
				titleImageHeight = Math.round(titleImageHeight * scale);
			}
			
			titleImageUrl = imgElem.imageurl;
		}
	}
	
	var titleImagePadding = comp.currentstyle.titleimagepadding;
	var titleImagePaddingL = 0,
		titleImagePaddingT = 0,
		titleImagePaddingR = 0,
		titleImagePaddingB = 0;
		
	if ( !this.gfn_isEmpty(titleImagePadding) && titleImageWidth > 0 && titleImageHeight > 0 )
	{
		var paddingSize = this.prt_getPaddingSize(titleImagePadding, scale);
		titleImagePaddingL = paddingSize[0];
		titleImagePaddingT = paddingSize[1];
		titleImagePaddingR = paddingSize[2];
		titleImagePaddingB = paddingSize[3];
	}
	
	var titlePadding = comp.currentstyle.titlepadding;
	var titlePaddingL = 0,
		titlePaddingT = 0,
		titlePaddingR = 0,
		titlePaddingB = 0;	
	
	if ( !this.gfn_isEmpty(titlePadding) )
	{
		var paddingSize = this.prt_getPaddingSize(titlePadding, scale);
		titlePaddingL = paddingSize[0];
		titlePaddingT = paddingSize[1];
		titlePaddingR = paddingSize[2];
		titlePaddingB = paddingSize[3];
	}
	
	var defaultGap = 10;
	if ( scale < 1 )
	{	
		defaultGap = Math.round(defaultGap * scale);
	}
	
	var titleLeft = 0, titleTop = 0, titleWidth = 0, titleHeight = 0;
	var boxLeft = 0, boxTop = 0, boxWidth = 0, boxHeight = 0;
	var textSize = this.gfn_getTextSize(comp);
	var textWidth = textSize[0];
	var textHeight = textSize[1];
	
	if ( scale < 1 )
	{	
		textWidth = Math.round(textWidth * scale);
		textHeight = Math.round(textHeight * scale);
	}
	
	var titleImageAlign = comp.currentstyle.titleimagealign;
	var titleImageHAlign = "center";
	var titleImageVAlign = "middle";
	if ( !this.gfn_isEmpty(titleImageAlign) )
	{
		titleImageHAlign = titleImageAlign.halign.toString();
		titleImageVAlign = titleImageAlign.valign.toString();
	}
		
	// 영역 크기
	titleWidth = textWidth;
	titleWidth += titlePaddingL + titlePaddingR;
	titleWidth += titleImagePaddingL + titleImagePaddingR;
	
	if ( titleImageHAlign == "lefttext" || titleImageHAlign == "righttext" )
	{
		if ( titleImageWidth > 0 && titleImageHeight > 0 )
		{
			titleWidth += titleImageWidth;
		}
	}
			
	titleHeight = Math.max(textHeight, titleImageHeight);	
	titleHeight += titlePaddingT + titlePaddingB;
	titleHeight += titleImagePaddingT + titleImagePaddingB;
	
	if ( titleImageVAlign == "toptext" || titleImageVAlign == "bottomtext" )
	{
		if ( titleImageWidth > 0 && titleImageHeight > 0 )
		{
			titleHeight += titleImageHeight;
		}
	}
	
	var borderWidth = this.gfn_getBorderWidth(comp);
	
	if ( titleAlign.substr(0, 3) == "top" )
	{		
		titleTop = 0;
		
		var halign = titleAlign.substr(3);
		if ( halign == "left" )
		{
			titleLeft = defaultGap;			
		}
		else if ( halign == "center" )
		{
			titleLeft = Math.round((compPos[2] - titleWidth)/2);
		}
		else if ( halign == "right" )
		{	
			titleLeft = compPos[2] - titleWidth - defaultGap;
		}		
		
		boxLeft = 0;
		boxTop = Math.round(titleHeight/2);
		boxWidth = compPos[2] - (borderWidth[0] + borderWidth[2]);
		boxHeight = compPos[3] - (borderWidth[1] + borderWidth[3]) - boxTop;	
	}
	else if ( titleAlign.substr(0, 4) == "left" )
	{
		titleLeft = 0;
		
		var valign = titleAlign.substr(4);
		if ( valign == "top" )
		{
			titleTop = defaultGap;
		}
		else if ( valign == "center" )
		{
			titleTop = Math.round((compPos[3] - titleHeight)/2);
		}
		else if ( valign == "bottom" )
		{	
			titleTop = compPos[3] - titleHeight - defaultGap;
		}
		
		boxLeft = Math.round(titleWidth/2);
		boxTop = 0;
		boxWidth = compPos[2] - (borderWidth[0] + borderWidth[2]) - boxLeft;
		boxHeight = compPos[3] - (borderWidth[1] + borderWidth[3]);	
	}
	else if ( titleAlign.substr(0, 5) == "right" )
	{
		boxLeft = 0;
		boxTop = 0;
		boxWidth = compPos[2] - (borderWidth[0] + borderWidth[2]) - Math.round(titleWidth/2);
		boxHeight = compPos[3] - (borderWidth[1] + borderWidth[3]);	
		
		titleLeft = compPos[2] - (borderWidth[0] + borderWidth[2]) - titleWidth;
		
		var valign = titleAlign.substr(5);
		if ( valign == "top" )
		{
			titleTop = defaultGap;
		}
		else if ( valign == "center" )
		{
			titleTop = Math.round((compPos[3] - titleHeight)/2);
		}
		else if ( valign == "bottom" )
		{	
			titleTop = compPos[3] - titleHeight - defaultGap;
		}
	}
	else if ( titleAlign.substr(0, 6) == "bottom" )
	{		
		titleTop = compPos[3] - Math.round(titleHeight/2) - defaultGap;
		
		var halign = titleAlign.substr(6);
		if ( halign == "left" )
		{
			titleLeft = defaultGap;			
		}
		else if ( halign == "center" )
		{
			titleLeft = Math.round((compPos[2] - titleWidth)/2);
		}
		else if ( halign == "right" )
		{	
			titleLeft = compPos[2] - titleWidth - defaultGap;
		}		
		
		boxLeft = 0;
		boxTop =0;
		boxWidth = compPos[2] - (borderWidth[0] + borderWidth[2]);
		boxHeight = compPos[3] - (borderWidth[1] + borderWidth[3]) - Math.round(titleHeight/2);
	}	
	
	var indentStr2 = this.gfn_repeatStr("	", indent+1);
	var indentStr3 = this.gfn_repeatStr("	", indent+2);
	var indentStr4 = this.gfn_repeatStr("	", indent+3);
		
	// box 영역
	tag += indentStr2;
	tag += "<div id=\""+compFullName+"_box\" style=\"position:absolute; overflow:hidden;";
	tag += " left:"+boxLeft+"px; top:"+boxTop+"px;";
	tag += " width:"+boxWidth+"px; height:"+boxHeight+"px;";
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);	
	tag += "\">\n";
	
	// box background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+2);
		
	tag += indentStr2 + "</div>\n";
	
	// title 영역
	var titleBackground = comp.currentstyle.titlebackground;
	var titleGradation = comp.currentstyle.titlegradation;
	
	tag += indentStr2;
	tag += "<div id=\""+compFullName+"_title\" style=\"position:absolute; overflow:hidden;";
	tag += " left:"+titleLeft+"px; top:"+titleTop+"px;";
	tag += " width:"+titleWidth+"px; height:"+titleHeight+"px;";	
	
	var bgColor = this.prt_getBackgroundColorHtmlStyle(titleBackground, titleGradation);
	if ( this.gfn_isEmpty(bgColor) )
	{
		bgColor = " background-color:#ffffff;";
	}
	
	tag += bgColor;
	tag += "\">\n";
	
	// title background image
	tag += this.prt_getBackgroundImageTagString(titleBackground, scale, indent+2, boxWidth, boxHeight);
		
	var tempL = 0, tempT = 0, tempW = 0, tempH = 0;
	
	// titleimage
	if ( !this.gfn_isEmpty(titleImage) && !this.gfn_isEmpty(titleImageUrl) )
	{		
		tempL = titlePaddingL + titleImagePaddingL;
		tempT = titlePaddingT + titleImagePaddingT;
		tempW = titleWidth;
		tempW -= (titlePaddingL + titlePaddingR)
		tempW -= (titleImagePaddingL + titleImagePaddingR);
		tempH = titleHeight;
		tempH -= (titlePaddingT + titlePaddingB);
		tempH -= (titleImagePaddingT + titleImagePaddingB);
				
		tag += indentStr3;
		tag += "<div style=\"position:absolute; overflow:hidden;";
		tag += " left:"+ tempL +"px; top:"+ tempT +"px;";		
		tag += " width:"+ tempW +"px; height:"+ tempH +"px;";
		tag += " background-image:url('" + titleImageUrl + "');";
		tag += " background-repeat:no-repeat;";
		tag += " background-size:"+titleImageWidth+" " + titleImageHeight + "px;";

		var posH = "50%";
		if ( titleImageHAlign.substr(0, 4) == "left" )
		{
			posH = "0%";
		}
		else if ( titleImageHAlign.substr(0, 5) == "right" )
		{
			posH = "100%";
		}
		
		var posV = "50%";
		if ( titleImageVAlign.substr(0, 3) == "top" )
		{
			posV = "0%";
		}
		else if ( titleImageVAlign.substr(0, 6) == "bottom" )
		{
			posV = "100%";
		}
		
		tag += " background-position:" + posH + " " + posV + ";";
		tag += "\"></div>\n";
	}
	
	tempL = titlePaddingL;	
	if ( titleImageHAlign == "lefttext" )
	{
		tempL += titleImagePaddingL + titleImageWidth;
	}	
	
	if ( titleImageHeight > textHeight )
	{
		tempT = Math.round((titleImageHeight-textHeight)/2);
	}
	else
	{		
		tempT = titlePaddingT;
		if ( titleImageVAlign == "toptext" )
		{
			tempT += titleImagePaddingT + titleImageHeight;	
		}
	}
		
 	tempW = textWidth;
 	tempH = textHeight;

	// text
	tag += indentStr3;
	tag += "<div style=\"position:absolute; overflow:hidden; display:table-cell;";
	tag += " left:"+tempL+"px; top:"+tempT+"px;";
	tag += " width:"+tempW+"px; height:"+tempH+"px;";
	tag += " text-align:left; vertical-align:middle;";
	
	// font 속성 적용
	tag += this.prt_getFontHtmlStyleByComp(comp, scale);
	
	// color 속성 적용
	tag += this.prt_getColorHtmlStyleByComp(comp);	
	
	tag += "\">";
	
	// text 지정
	var text = comp.text;
	
	if ( this.gfn_isUndefined(text) )
	{
		text = "";
	}
	
	text = this.prt_replaceHtmlSpecialChar(text);
	tag += text + "</div>\n";	// text
	
	tag += indentStr2 + "</div>\n"; // title 영역
	tag += indentStr + "</div>\n";

	return tag;
};

/**
 * ListBox Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getListBoxCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);

	// 아이템 변환 ==> 현재 보이는 항목만 변환, 가로 스크롤은 적용 안함
	var item;	// StaticControl
	var sIndex = comp._get_first_visible_row();	
	var eIndex = comp._get_last_visible_row(true);		
	for (var i=sIndex; i<=eIndex; i++)
	{
		item = comp._get_rowobj_byrow(i);

		this.prt_setScalePrintPosition(item, scale);

		tag += this.prt_getBasicCompTagString(item, scale, indent+1);
		
		this.gfn_deleteUserProperty(item, "scalePrintPosition");
	}

	tag += indentStr + "</div>\n";
		
	return tag;	
};

/**
 * Menu Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getMenuCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
		
	// 아이템 변환
	var item;
	var items = comp._items;
	for (var i=0,len=items.length; i<len; i++)
	{
		item = comp._getItem(i); // MenuItem <- StaticCtrl
		
 		this.prt_setScalePrintPosition(item, scale);
 
 		tag += this.prt_getBasicCompTagString(item, scale, indent+1);
 		
 		this.gfn_deleteUserProperty(item, "scalePrintPosition");
	}

	tag += indentStr + "</div>\n";
		
	return tag;	
};

/**
 * ProgressBar Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getProgressBarCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var indentStr2 = this.gfn_repeatStr("	", indent+1);	
	
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
	
	// padding
	var padding = this.gfn_getPadding(comp);
	var l = padding[0];
	var t = padding[1];
	var r = padding[2];
	var b = padding[3];

	if ( scale < 1 )
	{
		l = Math.round(l * scale);
		t = Math.round(t * scale);
		r = Math.round(r * scale);
		b = Math.round(b * scale);
	}
	
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var paddingWidth = compPos[2] - (l+r);
	var paddingHeight = compPos[3] - (t+b);
	
	tag += indentStr2;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+l+"px;";
	tag += " top:"+t+"px;";
	tag += " width:"+ paddingWidth +"px;";
	tag += " height:"+ paddingHeight +"px;";
	tag += "\">\n";	
	
	// progress
	if ( comp.pos > 0 )
	{	
		var barType = (comp.currentstyle.bartype ? comp.currentstyle.bartype.value : "normal");
		var itemList = [];	// StaticControl List
		
		if ( barType == "image" )
		{
			itemList = comp.progress_img_list || [];
			
			if ( comp.start_img ) itemList.splice(0, 0, comp.start_img);
			if ( comp.end_img ) itemList.push(comp.end_img);
		}
		else
		{
			var smooth = (comp.currentstyle.smooth ? comp.currentstyle.smooth.value : "true");
			itemList = ( smooth == "true" ? [comp.cellitem] : comp.celllist );			
		}
		
		var item;
		for (var i=0,len=itemList.length; i<len; i++)
		{
			item = itemList[i];
			
			this.prt_setScalePrintPosition(item, scale);

			tag += this.prt_getBasicCompTagString(item, scale, indent+2);
			
			this.gfn_deleteUserProperty(item, "scalePrintPosition");				
		}
	}
		
	tag += indentStr2 + "</div>\n";	// padding
	
	// text
	if ( !this.gfn_isEmpty(comp.text) )
	{
		tag += indentStr2;
		tag += "<div style=\"position:absolute; overflow:hidden;";
		tag += " left:"+l+"px;";
		tag += " top:"+t+"px;";
		tag += " width:"+ paddingWidth +"px;";
		tag += " height:"+ paddingHeight +"px;";
		tag += "\">\n";	
		
		// text, align, font, color
		tag += this.prt_getTextWithAlignTagString(comp, scale, indent+2, paddingWidth, paddingHeight);
		
		tag += indentStr2 + "</div>\n";
	}
	
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Radio Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getRadioCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var indentStr2 = this.gfn_repeatStr("	", indent+1);
	var indentStr3 = this.gfn_repeatStr("	", indent+2);
	var indentStr4 = this.gfn_repeatStr("	", indent+3);
	var indentStr5 = this.gfn_repeatStr("	", indent+4);
	
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
	
	// padding
	var padding = this.gfn_getPadding(comp);
	var l = padding[0];
	var t = padding[1];
	var r = padding[2];
	var b = padding[3];
	
	var itemPadding = comp.currentstyle.itempadding;
	if ( !this.gfn_isEmpty(itemPadding) )
	{
		var paddingSize = this.prt_getPaddingSize(itemPadding, 1);
		l += paddingSize[0];
		t += paddingSize[1];
		r += paddingSize[2];
		b += paddingSize[3];
	}
	
	if ( scale < 1 )
	{
		l = Math.round(l * scale);
		t = Math.round(t * scale);
		r = Math.round(r * scale);
		b = Math.round(b * scale);
	}
	
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var paddingWidth = compPos[2] - (l+r);
	var paddingHeight = compPos[3] - (t+b);
		
	tag += indentStr2;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+l+"px;";
	tag += " top:"+t+"px;";
	tag += " width:"+ paddingWidth +"px;";
	tag += " height:"+ paddingHeight +"px;";
	tag += "\">\n";
	
	// contents
	var innerDataset = comp.getInnerDataset();
	var codeColumn = comp.codecolumn;
	var dataColumn = comp.datacolumn;
	var columnCount = comp.columncount;
	var itemDirection = comp.direction;
	
	if ( this.gfn_isEmpty(itemDirection) )
	{
		itemDirection = "horizontal";
	}

	var itemCount = innerDataset.rowcount;
	var rowCount = comp.rowcount;
	var colCount = comp.columncount;
	
	if ( (rowCount * colCount) < itemCount )
	{
		if ( colCount < 1 )
		{
			colCount = 1;
			rowCount = itemCount;
		}
		else
		{
			rowCount = Math.ceil(itemCount/colCount);
		}
	}
	
	var itemWidth = Math.round(paddingWidth/colCount);
	var itemHeight = Math.round(paddingHeight/rowCount);
		
	var align = comp.currentstyle.align;
	var valign, halign;
	if ( this.gfn_isEmpty(align) )
	{
		valign = "left";
		halign = "middle";
	}
	else
	{
		valign = align.valign.toString();
		halign = align.halign.toString();
	}
	
	var buttonAlign = comp.currentstyle.buttonalign;
	var buttonHAlign = "left";
	var buttonVAlign = "middle";
	if ( !this.gfn_isEmpty(buttonAlign) )
	{
		buttonHAlign = buttonAlign.halign.toString();
		buttonVAlign = buttonAlign.valign.toString();
	}
	
	var buttonPosH = this.gfn_decode(buttonHAlign, "center", "50", "right", "100", "0");
	var buttonPosV = this.gfn_decode(buttonVAlign, "middle", "50", "bottom", "100", "0");
	
	// button 적용 (buttonbackground.image -> buttonborder)
	var buttonSize = comp.currentstyle.buttonsize.value;
	if ( this.gfn_isEmpty(buttonSize) )
	{
		buttonSize = 0;
	}
	else
	{
		buttonSize = parseInt(buttonSize);
		
		if ( scale < 1 )
		{
			buttonSize = Math.round(buttonSize * scale);
		}
	}
	
	var buttonBorder = comp.currentstyle.buttonborder;
	var borderSize = this.prt_getBorderSize(buttonBorder);
	var borderSizeWidth = borderSize[0] + borderSize[2];
	var borderSizeHeight = borderSize[1] + borderSize[3];
	
	var buttonTag = "";
	var buttonBackground = comp.currentstyle.buttonbackground;
	var bgImage = buttonBackground.image.toString();
	
	var l = 0, t = 0;
	if ( buttonHAlign == "center" )
	{
		l = Math.round((itemWidth-buttonSize)/2);
	}
	else if ( buttonHAlign == "right" ) 
	{
		l = itemWidth - buttonSize;
	}
	
	if ( buttonVAlign == "middle" )
	{
		t = Math.round((itemHeight-buttonSize)/2);
	}
	else if ( buttonVAlign == "bottom" ) 
	{
		t = itemHeight - buttonSize;
	}
	
	var w = (buttonSize-borderSizeWidth);
	var h = (buttonSize-borderSizeHeight);
	
	if ( !this.gfn_isEmpty(bgImage) )
	{
		// 이미지 생성
		var imageFullPath = this.prt_getImageRealPath(bgImage);

		buttonTag = indentStr4;
		buttonTag += "<img style=\"position:absolute; left:"+l+"px; top:"+t+"px;";
		buttonTag += " width:"+w+"px; height:"+h+"px;\"";
		buttonTag += " src=\""+imageFullPath+"\">\n";
	}
	else
	{
		// 이미지가 없을 경우 보더 정보로 표시
		buttonTag = indentStr4;
		buttonTag += "<div style=\"position:absolute;";
		buttonTag += " left:"+l+"px; top:"+t+"px;";
		buttonTag += " width:"+(buttonSize-borderSizeWidth)+"px;";
		buttonTag += " height:"+(buttonSize-borderSizeHeight)+"px;";
		buttonTag += this.prt_getBorderHtmlStyle(buttonBorder);
		buttonTag += " border-top-left-radius:50%;";
		buttonTag += " border-top-right-radius:50%;";
		buttonTag += " border-bottom-right-radius:50%;";
		buttonTag += " border-bottom-left-radius:50%;";
		buttonTag += "\"\></div>\n";
	}
	
	// 선택 button
	var selectButtonTag = "";
	var selectIndex = innerDataset.findRow(codeColumn, comp.value);
	if ( selectIndex > -1 )
	{		
		var buttonImage = comp.currentstyle.buttonimage;
		if ( !this.gfn_isEmpty(buttonImage) )
		{
			// 이미지 생성
			var imageFullPath = this.prt_getImageRealPath(buttonImage.toString());
			var size = nexacro._getImageSize(buttonImage.toString(), function(){}, this);
			if ( size )
			{
				w = size.width;
				h = size.height;
				if ( scale < 1 )
				{
					w = Math.round(w * scale);
					h = Math.round(h * scale);
				}
				l += Math.floor((buttonSize-w)/2);
				t += Math.floor((buttonSize-h)/2);
			}

			selectButtonTag = indentStr4;
			selectButtonTag += "<img style=\"position:absolute; left:"+l+"px; top:"+t+"px;";
			selectButtonTag += " width:"+w+"px; height:"+h+"px;\"";
			selectButtonTag += " src=\""+imageFullPath+"\">\n";
		}
		else
		{
			// 이미지가 없을 경우 보더 정보로 표시
			var selectGap = 2;
			
			w = (buttonSize-borderSizeWidth - selectGap*2);
			h = (buttonSize-borderSizeHeight - selectGap*2);
			
			selectButtonTag = indentStr4;
			selectButtonTag += "<div style=\"position:absolute;";
			selectButtonTag += " left:"+(l+selectGap)+"px; top:"+(t+selectGap)+"px;";
			selectButtonTag += " width:"+w+"px;";
			selectButtonTag += " height:"+h+"px;";
			selectButtonTag += " background-color:#000000;";
			selectButtonTag += " border-radius:"+(Math.round(w/2))+"px;";
			selectButtonTag += "\"\></div>\n";
		}
	}
		
	var textPadding = comp.currentstyle.textpadding;
	var textPaddingL =0,
		textPaddingT =0,
		textPaddingR =0,
		textPaddingB =0;
		
	if ( !this.gfn_isEmpty(textPadding) )
	{
		var paddingSize = this.prt_getPaddingSize(textPadding, scale);
		textPaddingL = paddingSize[0];
		textPaddingT = paddingSize[1];
		textPaddingR = paddingSize[2];
		textPaddingB = paddingSize[3];
	}

	if ( halign == "left" && buttonHAlign == "left" )
	{
		textPaddingL = textPaddingL + buttonSize;
	} 
	else if ( halign == "right" && buttonHAlign == "right" )
	{
		textPaddingR = textPaddingR + buttonSize;
	}
	
	var itemIndex = 0;
	var itemLeft = 0;
	var itemTop = 0;	
	
	var iCount = 0;
	var jCount = 0;
	
	if ( itemDirection == "horizontal" )
	{
		iCount = rowCount;
		jCount = colCount;
	}
	else
	{
		iCount = colCount;
		jCount = rowCount;			
	}
	
	for (var i=0; i<iCount; i++)
	{
		if ( itemDirection == "horizontal" )
		{
			itemLeft = 0;
		}
		else
		{
			itemTop = 0;
		}
		
		for (var j=0; j<jCount; j++)
		{			
			if ( (itemIndex+1) > itemCount ) continue;
						
			tag += indentStr3;
			tag += "<div style=\"position:absolute; overflow:hidden;";
			tag += " left:"+itemLeft+"px; top:"+itemTop+"px; width:"+itemWidth+"px; height:"+itemHeight+"px;";
			tag += "\">\n";
			
			// button
			tag += buttonTag;
			
			if ( itemIndex == selectIndex )
			{
				tag += selectButtonTag;
			}
			
			// textpadding + buttonsize
			tag += indentStr4;
			tag += "<div style=\"position:absolute; overflow:hidden;";
			tag += " left:"+textPaddingL+"px;";
			tag += " top:"+textPaddingT+"px;";
			tag += " width:"+ (itemWidth - textPaddingL - textPaddingR) +"px;";
			tag += " height:"+ (itemHeight - textPaddingT - textPaddingB) +"px;";
			tag += "\">\n";
			
			// text
			tag += indentStr5;
			tag += "<div style=\"display:table-cell;";
			tag += " left:0px; top:0px;";
			tag += " width:"+itemWidth+"px; height:"+itemHeight+"px;";
			tag += " text-align:"+halign+"; vertical-align:"+valign+";";
			
			// font 속성 적용
			tag += this.prt_getFontHtmlStyleByComp(comp, scale);
			
			// color 속성 적용
			tag += this.prt_getColorHtmlStyleByComp(comp);	
			
			tag += "\">";
			
			// text 지정
			var text = innerDataset.getColumn(itemIndex, dataColumn);
			
			if ( this.gfn_isUndefined(text) )
			{
				text = "";
			}
			
			text = this.prt_replaceHtmlSpecialChar(text);
			tag += text + "</div>\n";	// text

			tag += indentStr4 + "</div>\n";
			tag += indentStr3 + "</div>\n";
			
			itemIndex += 1;
			
			if ( itemDirection == "horizontal" )
			{
				itemLeft += itemWidth;
			}
			else
			{
				itemTop += itemHeight;
			}
		}
	
		if ( itemDirection == "horizontal" )
		{
			itemTop += itemHeight;
		}
		else
		{
			itemLeft += itemWidth;
		}
	}
	
	tag += indentStr2 + "</div>\n";	// padding
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Spin Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getSpinCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";

	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);		

	// spinedit
	tag += this.prt_getBasicCompTagString(comp.spinedit, scale, indent+1);
	
	// spinupbutton
	tag += this.prt_getBasicCompTagString(comp.spinupbutton, scale, indent+1);
	
	// spindownbutton
	tag += this.prt_getBasicCompTagString(comp.spindownbutton, scale, indent+1);	

	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * Tab Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getTabCompTagString = function(comp, scale, indent)
{	
	// 현재 보이는 탭페이지만 출력 (버튼도 하나만 출력)
	var tabindex = comp.tabindex;	
	var tabpage = comp.tabpages[tabindex];
	
	if ( this.gfn_isEmpty(tabpage) ) return "";

	var indentStr = this.gfn_repeatStr("	", indent);
	var indentStr2 = this.gfn_repeatStr("	", indent+1);	
	var compFullName = this.prt_getCompFullName(comp);

	// tab area
	var tag = indentStr;
	tag += "<div id=\""+compFullName+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);	
	tag += "\">\n";
	
	var borderWidths = this.gfn_getBorderWidth(comp);
	
	// tab button
	var tabposition = comp.tabposition;
	var btnComp = this.prt_getPrintFormProxyComp("Button");
	var button;
	var buttons = comp._tabButtons;
	var border, borderPos;
	var lineL, lineT, lineR, lineB, lineTag;
	var l, t, w, h;
	
	for (var i=0,len=buttons.length; i<len; i++)
	{
		button = buttons[i];
		
		// scale position 재구성을 위해..
		this.gfn_deleteUserProperty(button, "scalePrintPosition");

		tag += indentStr2;
		tag += "<div id=\""+compFullName+"_tabbutton"+i+"\" style=\"";
		tag += this.prt_getPositionHtmlStyleByComp(button, scale);
		tag += this.prt_getBackgroundColorHtmlStyleByComp(button);
		tag += this.prt_getBorderTypeHtmlStyleByComp(button);
		
		// getPositionHtmlStyleByComp 에서 추가됨
		var scalePos = this.gfn_getUserProperty(button, "scalePrintPosition");
		
		// border 는 따로 계산
		border = button.currentstyle.border;
		
		if ( tabposition == "top" )
		{
			borderPos = ["top", "left", "right"];
			lineL = scalePos[0]+1;
			lineT = scalePos[3]+1;
			lineW = scalePos[2];
			lineH = borderWidths[1];
		}
		else if ( tabposition == "left" )
		{
			borderPos = ["top", "left", "bottom"];
			lineL = scalePos[0]+scalePos[2];
			lineT = scalePos[1];
			lineW = borderWidths[0];
			lineH = scalePos[3];
		}
		else if ( tabposition == "right" )
		{
			borderPos = ["top", "right", "bottom"];
			lineL = scalePos[0];
			lineT = scalePos[1];
			lineW = borderWidths[2];
			lineH = scalePos[3];
		}
		else
		{
			borderPos = ["left", "right", "bottom"];
			lineL = scalePos[0];
			lineT = scalePos[1];
			lineW = scalePos[2];
			lineH = borderWidths[3];
		}

		// 1 회 입력
		if ( !this.gfn_isEmpty(border.width) )
		{			
			for (var j=0,len2=borderPos.length; j<len2; j++)
			{
				tag += " border-"+borderPos[j]+"-width:"+ border.width.replace("px", "") +"px;";
				tag += " border-"+borderPos[j]+"-style:"+ border.style +";";
				tag += " border-"+borderPos[j]+"-color:"+ border.color + ";";
			}
		}
		else
		{
			for (var j=0,len2=borderPos.length; j<len2; j++)
			{
				tag += " border-"+borderPos[j]+"-width:"+ border[borderPos[j] + "_width"].replace("px", "") +"px;";
				tag += " border-"+borderPos[j]+"-style:"+ border[borderPos[j] + "_style"] +";";
				tag += " border-"+borderPos[j]+"-color:"+ border[borderPos[j] + "_color"] + ";";
			}
		}

		tag += "\">\n";
		
		if ( this.gfn_isEmpty(button.currentstyle.align) )
		{
			button.style.set_align("center middle");
		}
		
		// text, align, font, color
		tag += this.prt_getTextWithAlignTagString(button, scale, indent+2, scalePos[2], scalePos[3]);
		
 		tag += indentStr2 + "</div>\n";
 		
 		if ( tabindex == i )
 		{
			lineTag = "";
			lineTag += "<div id=\""+compFullName+"_whiteLine\" style=\"position:absolute;";
			lineTag += " left:"+lineL+"px; top:"+lineT+"px; width:"+lineW+"px; height:"+lineH+"px;";
			lineTag += " background-color:#ffffff;\"></div>\n";
 		}
	}
	
	// tabpage area
	var tabpageArea = this.prt_getPrintFormProxyComp("Static");
	
	var tabpageAreaL = comp._tabpagearea.getOffsetLeft();
	var tabpageAreaT = comp._tabpagearea.getOffsetTop();
	var tabpageAreaW = comp._tabpagearea.getOffsetWidth();
	var tabpageAreaH = comp._tabpagearea.getOffsetHeight();
	
	// 보정이 필요하다.
	tabpageAreaT -= borderWidths[1];
	tabpageAreaW -= borderWidths[0] + borderWidths[2];
	tabpageAreaH -= borderWidths[1] + borderWidths[3];
	
	tabpageArea.move(tabpageAreaL, tabpageAreaT, tabpageAreaW, tabpageAreaH);
	tabpageArea.style.set_border(comp.currentstyle.border.valueOf());
	tabpageArea.style.set_bordertype(comp.currentstyle.bordertype.valueOf());
 	
	tag += indentStr2;
	tag += "<div id=\""+compFullName+"_tabpageArea\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(tabpageArea, scale);
	tag += this.prt_getBorderHtmlStyleByComp(tabpageArea);
	tag += this.prt_getBorderTypeHtmlStyleByComp(tabpageArea);	
	tag += "\">\n";
 	
	// tabpage : 보이는 영역만		
	var vScroll = tabpage.vscrollbar;
	var hScroll = tabpage.hscrollbar;
	var vScrollPos = vScroll ? vScroll.pos : 0;
	var hScrollPos = hScroll ? hScroll.pos : 0;
	var viewLeft = hScroll ? hScrollPos : 0;
	var viewTop  = vScroll ? vScrollPos : 0;
	var viewRight = hScroll ? tabpageAreaW + hScrollPos : tabpageAreaW;
	var viewBottom = vScroll ? tabpageAreaH + vScrollPos : tabpageAreaH;	
	
	// 스크롤 보정값
	var scrollTop = 0, scrollLeft = 0;
	if ( viewTop > 0 )
	{
		scrollTop = Math.round( scale * viewTop );
	}
	if ( viewLeft > 0 )
	{	
		scrollLeft = Math.round( scale * viewLeft );
	}
	
	// tabpage component 변환
	var comp, comps = tabpage.components;
	//var isEmptyFunc = this.gfn_isEmpty;
	var scalePrintPosition;	
	for (var i=0,len=comps.length; i<len; i++)
	{
		comp = comps[i];
		
		if ( !this.prt_isPrintableComp(comp) ) continue;
		
		// Tabpage 스크롤 존재 시  현재 보이는 컴포넌트만 대상
		if ( tabpage.vscrollbar || tabpage.hscrollbar )
		{
			if ( comp.getOffsetRight() > viewLeft && 
				 comp.getOffsetLeft() < viewRight && 
				 comp.getOffsetTop() < viewBottom &&
				 comp.getOffsetBottom() > viewTop )
			{
				// 출력 위치 정보를 재구성하여 스크롤 값을 보정처리
				this.prt_setScalePrintPosition(comp, scale);
				scalePrintPosition = this.gfn_getUserProperty(comp, "scalePrintPosition");	
				scalePrintPosition[0] = scalePrintPosition[0] - scrollLeft;
				scalePrintPosition[1] = scalePrintPosition[1] - scrollTop;
				
				tag += this.prt_getCompTagString(comp, scale, indent+2);
			}
		}
		else
		{
			tag += this.prt_getCompTagString(comp, scale, indent+2);
		}
	}
	
	tag += indentStr2 + "</div>\n"; // tabpage area
	
	tag += indentStr2 + lineTag;
	
 	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * TextArea Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getTextAreaCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBackgroundColorHtmlStyleByComp(comp);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += this.prt_getBorderTypeHtmlStyleByComp(comp);
	tag += "\">\n";
	
	// background image
	tag += this.prt_getBackgroundImageTagStringByComp(comp, scale, indent+1);
	
	// padding
	var padding = this.gfn_getPadding(comp);
	var l = padding[0];
	var t = padding[1];
	var r = padding[2];
	var b = padding[3];

	if ( scale < 1 )
	{
		l = Math.round(l * scale);
		t = Math.round(t * scale);
		r = Math.round(r * scale);
		b = Math.round(b * scale);
	}
		
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	var paddingWidth = compPos[2] - (l+r);
	var paddingHeight = compPos[3] - (t+b);
	
	var indentStr2 = this.gfn_repeatStr("	", indent+1);
	tag += indentStr2;
	tag += "<div style=\"position:absolute; overflow:hidden;";
	tag += " left:"+l+"px;";
	tag += " top:"+t+"px;";
	tag += " width:"+ paddingWidth +"px;";
	tag += " height:"+ paddingHeight +"px;";
	tag += "\">\n";
	
	// html에는 스크롤을 보이지 않을 것이므로 스크롤 영역도 제외한다.
	if ( comp.vscrollbar )
	{
		paddingWidth -= Math.round( scale * comp.vscrollbar.getOffsetWidth());
	}
	if ( comp.hscrollbar )
	{
		paddingHeight -= Math.round( scale * comp.hscrollbar.getOffsetHeight());
	}
	
	var scrollTop = 0, scrollLeft = 0;
	if ( comp.vscrollbar && comp.vscrollbar.pos > 0 )
	{
		scrollTop = Math.round( scale * comp.vscrollbar.pos );	
		
		// top bottom padding 적용
		scrollTop += Math.round( scale * padding[1] );
		scrollTop += Math.round( scale * padding[3] );
	}
	if ( comp.hscrollbar && comp.hscrollbar.pos > 0 )
	{
		scrollLeft = Math.round( scale * comp.hscrollbar.pos );
				
		// left right padding 적용
		scrollLeft += Math.round( scale * padding[0] );
		scrollLeft += Math.round( scale * padding[2] );
	}	

	// 스크롤이 있는 경우 보이는 영역 만큼 위치 조정을 위한 tag 추가
	if ( scrollTop > 0 || scrollLeft > 0 )
	{
		var indentStr3 = this.gfn_repeatStr("	", indent+2);
		tag += indentStr3;
		tag += "<div style=\"position:absolute;";
		tag += " left:"+(-1*scrollLeft)+"px;";
		tag += " top:"+(-1*scrollTop)+"px;";
		tag += " width:"+paddingWidth+"px; height:"+paddingHeight+"px;\">\n";
		tag += this.prt_getTextWithAlignTagString(comp, scale, indent+3, paddingWidth, paddingHeight);
		tag += indentStr3 + "</div>\n";
	}
	else
	{
		// text, align, font, color
		tag += this.prt_getTextWithAlignTagString(comp, scale, indent+2, paddingWidth, paddingHeight);
	}
	
	tag += indentStr2 + "</div>\n";	// padding
	tag += indentStr + "</div>\n";
	
	return tag;
};

/**
 * WebBrowser Component -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getWebBrowserCompTagString = function(comp, scale, indent)
{
	var indentStr = this.gfn_repeatStr("	", indent);	
	var indentStr2 = this.gfn_repeatStr("	", indent+1);	
	
	var tag = indentStr;
	tag += "<div id=\""+this.prt_getCompFullName(comp)+"\" style=\"";
	tag += this.prt_getPositionHtmlStyleByComp(comp, scale);
	tag += this.prt_getBorderHtmlStyleByComp(comp);
	tag += "\">\n";
	
	var scalePos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	
	tag += indentStr2;
	tag += "<iframe frameborder=\"0\" src=\""+ comp._url +"\"";
	tag += " style=\"position:absolute; left:0px; top:0px;";
	tag += " width:"+scalePos[2]+"px; height:"+scalePos[3]+"px;\"></iframe>\n";
	
	tag += indentStr + "</div>\n";
	
	return tag;	
};

/**
 * property position -> html style 속성 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @return {string} tag string
*/
LIB_PRINT.prt_getPositionHtmlStyleByComp = function(comp, scale)
{
	var x, y, w, h;
	var scalePrintPosition = this.gfn_getUserProperty(comp, "scalePrintPosition");
	if ( this.gfn_isEmpty(scalePrintPosition) )
	{
		this.prt_setScalePrintPosition(comp, scale);
		scalePrintPosition = this.gfn_getUserProperty(comp, "scalePrintPosition");
	}
	
	x = scalePrintPosition[0];
	y = scalePrintPosition[1];
	w = scalePrintPosition[2];
	h = scalePrintPosition[3];
	
	return "position:absolute; left:"+x+"px; top:"+y+"px; width:"+w+"px; height:"+h+"px; overflow:hidden;";
};

/**
 * property text -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @param {number} width text 영역 너비
 * @param {number} height text 영역 높이
 * @return {string} tag string
*/
LIB_PRINT.prt_getTextWithAlignTagString = function(comp, scale, indent, width, height)
{	
	var text = comp.displaytext;	
	if ( this.gfn_isEmpty(text) )
	{
		text = comp.text;
	}
	
	// check displaynulltext
	if ( "displaynulltext" in comp && this.gfn_isEmpty(text) )
	{
		text = comp.displaynulltext;
	}
	
	if ( this.gfn_isEmpty(text) )
	{
		return "";
	}

	var indentStr = this.gfn_repeatStr("	", indent);
	var tag = indentStr;	
	tag += "<div style=\"display:table-cell; width:"+width+"px; height:"+height+"px;";

	// align 속성 적용
	tag += this.prt_getAlignHtmlStyleByComp(comp);

	// font 속성 적용
	tag += this.prt_getFontHtmlStyleByComp(comp, scale);
	
	// color 속성 적용
	tag += this.prt_getColorHtmlStyleByComp(comp);	

	// wordwrap 속성 적용
	tag += this.prt_getWordWrapHtmlStyleByComp(comp);

	tag += "\">";
	
	// text 지정
	text = this.prt_replaceHtmlSpecialChar(text);
	
	tag += text;
	tag += "</div>\n";
	
	return tag;
};

/**
 * 대상 컴포넌트의 align -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getAlignHtmlStyleByComp = function(comp)
{
	var tag = "";	
	var halign = "";
	var valign = "";
	
	// currentstyle 값으로 null 을 반환하는 컴포넌트 존재함.
	var align = comp.currentstyle.align;
	if ( !align )
	{
		align = comp.on_find_CurrentStyle_align("normal");
	}	
	
	if ( this.gfn_isEmpty(align) && comp.parent )
	{
		align = comp.parent.on_find_CurrentStyle_align("normal");
	}
	else
	{
		halign = align.halign;
		valign = align.valign;
	}
	
	if ( this.gfn_isEmpty(halign) )
	{
		halign = "left";
	}
	if ( this.gfn_isEmpty(valign) )
	{
		valign = "top";
	}	
	
	tag += " text-align:"+halign+"; vertical-align:"+valign+";";
	
	return tag;
};

/**
 * 대상 컴포넌트의 background color -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getBackgroundColorHtmlStyleByComp = function(comp)
{
	var tag = "";
	var curBackground = comp.currentstyle.background;
	
	if ( !this.gfn_isEmpty(curBackground) )
	{
		tag = this.prt_getBackgroundColorHtmlStyle(curBackground, comp.currentstyle.gradation);		
	}
	
	return tag;
};

/**
 * background color -> html style 변환.
 * @param {object} background 대상 background object
 * @param {object} background 대상 background gradation object
 * @return {string} tag string
*/
LIB_PRINT.prt_getBackgroundColorHtmlStyle = function(background, gradation)
{
	var tag = "";
	
	if ( !this.gfn_isEmpty(background) )
	{	
		var bgColor = background.color;
		if ( bgColor == "@gradation" )
		{			
			if ( this.gfn_isEmpty(gradation) )
			{
				bgColor = "";
			}
			else
			{
				// 그라데이션이 적용되었다면 start - end color 의 중간 적용
				var sColor = gradation.start_color || "#ffffff";
				var eColor = gradation.end_color || "#ffffff";
				
				var sRGB = this.gfn_hexToRgb(sColor);
				var eRGB = this.gfn_hexToRgb(eColor);
				
				var r = Math.round((sRGB[0]+eRGB[0])/2);
				var g = Math.round((sRGB[1]+eRGB[1])/2);
				var b = Math.round((sRGB[2]+eRGB[2])/2);
				
				bgColor = this.gfn_rgbToHex(r, g, b);
			}
		}

		if ( '#' == bgColor.charAt(0) )
		{
			bgColor = bgColor.substr(0,7);
		}
		
		tag = " background-color:"+bgColor+";";
	}
	
	return tag;
};

/**
 * 대상 컴포넌트의 background image -> html tag 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @return {string} tag string
*/
LIB_PRINT.prt_getBackgroundImageTagStringByComp = function(comp, scale, indent)
{
	var curBackground = comp.currentstyle.background;
	var compPos = this.gfn_getUserProperty(comp, "scalePrintPosition");
	
	return this.prt_getBackgroundImageTagString(curBackground, scale, indent, compPos[2], compPos[3]);
};

/**
 * background image -> html tag 변환.
 * @param {object} background 대상 background object
 * @param {number} scale 스케일 조정 값
 * @param {number} indent 들여쓰기 레벨
 * @param {number} width 이미지 너비
 * @param {number} height 이미지 높이
 * @return {string} tag string
*/
LIB_PRINT.prt_getBackgroundImageTagString = function(background, scale, indent, width, height)
{
	if ( this.gfn_isNull(background) ) return "";
		
	var bgImage = background.image;
	
	if ( this.gfn_isEmpty(bgImage) ) return "";
	
	// 이미지 생성
	var imageFullPath = this.prt_getImageRealPath(bgImage);
	
	var tag = this.gfn_repeatStr("	", indent);
	
	var repeat = background.repeat;	
	if ( repeat == "stretch" || repeat == "quad" )
	{
		tag += "<img style=\"position:absolute; left:0px; top:0px; width:"+width+"px; height:"+height+"px;\"";
		tag += " src=\"" + imageFullPath + "\"";
		tag += "></img>\n";
	}
	else
	{	
		tag += "<div style=\"position:absolute; left:0px; top:0px; width:"+width+"px; height:"+height+"px;";
		tag += " background-image:url('" + imageFullPath + "');";

		if ( this.gfn_isEmpty(repeat) )
		{
			repeat = "no-repeat";
		}
		tag += " background-repeat:"+repeat+";";
		
		var position = background.position;		
		if ( !this.gfn_isEmpty(position) )
		{
			var posHV = position.split(" ");
			var posH = posHV[0];
			var posV = posHV[1];
			
			if ( posH == "left" ) 
			{
				posH = "0%";
			}
			else if ( posH == "center" ) 
			{
				posH = "50%";
			}
			else if ( posH == "right" ) 
			{
				posH = "100%";
			}
			else
			{
				posH += "%";
			}
			
			if ( posV == "top" ) 
			{
				posV = "0%";
			}
			else if ( posV == "middle" ) 
			{
				posV = "50%";
			}
			else if ( posV == "bottom" ) 
			{
				posV = "100%";
			}
			else
			{
				posV += "%";
			}

			tag += " background-position:" + posH + " " + posV + ";";
		}
		
		tag += "\"\></div>\n";
	}
	
	return tag;
};

/**
 * 대상 컴포넌트의 border -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getBorderHtmlStyleByComp = function(comp)
{
	// currentstyle 값으로 null 을 반환하는 컴포넌트 존재함.
	var border = comp.currentstyle.border;
	if ( !border )
	{
		border = comp.on_find_CurrentStyle_border("normal");
	}
	
	return this.prt_getBorderHtmlStyle(border);
};

/**
 * border -> html style 변환.
 * @param {object} border 대상 border object
 * @return {string} tag string
*/
LIB_PRINT.prt_getBorderHtmlStyle = function(border)
{
	var tag = "";
	
	if ( this.gfn_isEmpty(border) )
	{
		return " border:0px none #ffffff;";
	}
	else
	{
		//var isEmpty = this.gfn_isEmpty;

		// check cache
		var cacheName = border.toString().replace(/\s/g, "_");
		var cacheObj = this.gfn_getUserProperty(application, "formPrintStyleCache");		
		
		tag = cacheObj.border[cacheName];
		
		if ( !this.gfn_isUndefined(tag) )
		{
			return tag;
		}

		tag = "";
		
		var borderStyle = border.style;
		var borderWidth = border.width;
		var borderColor = border.color;
		var changeColor = "";

		// 1회 입력일 경우 
		if ( !this.gfn_isEmpty(borderStyle) )
		{	
			tag += " border-style:"+borderStyle+";";
			tag += " border-width:"+borderWidth+ (borderWidth.indexOf("px") > -1 ? ";" : "px;" );
			
			if ( '#' == borderColor.charAt(0) )
			{
				changeColor = borderColor.substr(0,7);
			}
			else
			{
				changeColor = borderColor;
			}
			
			tag += " border-color:"+changeColor+";";
		}
		else
		{
			var borderDir, borderDirs = ["left", "top", "right", "bottom"];
			var checkBorderStyle, checkBorderWidth, checkBorderColor;
			
			for (var i=0,len=borderDirs.length; i<len; i++)
			{
				borderDir = borderDirs[i];
				
				checkBorderStyle = border[borderDir+"_style"];
				checkBorderWidth = border[borderDir+"_width"];
				checkBorderColor = border[borderDir+"_color"];

				if ( '#' == checkBorderColor.charAt(0) )
				{
					checkBorderColor = checkBorderColor.substr(0,7);
				}				
				
				tag += " border-"+borderDir+"-style:" + checkBorderStyle + ";";
				tag += " border-"+borderDir+"-width:" + checkBorderWidth + (checkBorderWidth.indexOf("px") > -1 ? ";" : "px;" );
				tag += " border-"+borderDir+"-color:" + checkBorderColor + ";";
			}
		}
				
		// cache 등록
		cacheObj.border[cacheName] = tag;
	}
	
	return tag;
};

/**
 * border size 를 반환
 * @param {object} border 대상 border object
 * @return {array} [left, top , right, bottom]
*/
LIB_PRINT.prt_getBorderSize = function(border)
{
	var size = [0, 0, 0, 0];
	
	if ( !this.gfn_isEmpty(border) )
	{
		// check cache
		var cacheName = border.toString().replace(/\s/g, "_");
		var cacheObj = this.gfn_getUserProperty(application, "formPrintStyleCache");
		
		size = cacheObj.borderSize[cacheName];
		if ( !this.gfn_isUndefined(size) )
		{
			return size;
		}
		
		var l = 0, t = 0, r = 0, b = 0;
		if ( !this.gfn_isEmpty(border.left_width) )
		{
			l = parseInt(border.left_width.replace("px", ""));
		}
		if ( !this.gfn_isEmpty(border.top_width) )
		{
			t = parseInt(border.top_width.replace("px", ""));
		}
		if ( !this.gfn_isEmpty(border.right_width) )
		{
			r = parseInt(border.right_width.replace("px", ""));
		}
		if ( !this.gfn_isEmpty(border.bottom_width) )
		{
			b = parseInt(border.bottom_width.replace("px", ""));
		}						
		
		size = [l, t, r, b];
		
		// cache 등록
		cacheObj.borderSize[cacheName] = size;
	}
	
	return size;
};

/**
 * padding size 를 반환
 * @param {object} border 대상 border object
 * @return {array} [left, top , right, bottom]
*/
LIB_PRINT.prt_getPaddingSize = function(padding, scale)
{
	var l = 0;
	var t = 0;
	var r = 0;
	var b = 0;
	
	if ( !this.gfn_isEmpty(padding) )
	{
		l = isNaN(padding.left) ? 0 : padding.left;
		t = isNaN(padding.top) ? 0 : padding.top;
		r = isNaN(padding.right) ? 0 : padding.right;
		b = isNaN(padding.bottom) ? 0 : padding.bottom;
		
		if ( scale < 1 )
		{
			l = Math.round(scale * l);
			t = Math.round(scale * t);
			r = Math.round(scale * r);
			b = Math.round(scale * b);
		}
	}
	
	return [l, t, r, b];
};

/**
 * 대상 컴포넌트의 bordertype -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getBorderTypeHtmlStyleByComp = function(comp)
{
	// currentstyle 값으로 null 을 반환하는 컴포넌트 존재함.
	var bordertype = comp.currentstyle.bordertype;
	if ( !bordertype )
	{
		bordertype = comp.on_find_CurrentStyle_bordertype("normal");
	}
	
	return this.prt_getBorderTypeHtmlStyle(bordertype);	
};

/**
 * bordertype -> html style 변환.
 * @param {object} bordertype 대상 bordertype object
 * @return {string} tag string
*/
LIB_PRINT.prt_getBorderTypeHtmlStyle = function(bordertype)
{
	var tag = "";

	if ( !this.gfn_isEmpty(bordertype) )
	{		
		if ( bordertype.type == "round" )
		{
			var rx = bordertype.radiusx;
			var ry = bordertype.radiusy;
			var tl = bordertype.lefttop;
			var tr = bordertype.righttop;
			var bl = bordertype.leftbottom;
			var br = bordertype.rightbottom;
			
			if ( tl == "undefined" && tr == "undefined" && 
				 bl == "undefined" && br == "undefined" )
			{
				tag += " border-top-left-radius:"+rx+"px;";
				tag += " border-top-right-radius:"+ry+"px;";
				tag += " border-bottom-left-radius:"+ry+"px;";
				tag += " border-bottom-right-radius:"+rx+"px;";
			}
			else
			{
				tag += " border-top-left-radius:" + (tl ? rx : "0") + "px;";
				tag += " border-top-right-radius:" + (tr ? ry : "0") + "px;";
				tag += " border-bottom-left-radius:" + (bl ? ry : "0") + "px;";
				tag += " border-bottom-right-radius:" + (br ? rx : "0") + "px;";
			}
		}
	}
	
	return tag;
};

/**
 * font -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @param {number} scale 스케일 조정 값
 * @return {string} tag string
*/
LIB_PRINT.prt_getFontHtmlStyleByComp = function(comp, scale)
{
	// currentstyle 값으로 null 을 반환하는 컴포넌트 존재함.
	var font = comp.currentstyle.font;
	if ( !font )
	{
		font = comp.on_find_CurrentStyle_font("normal");
	}
	
	return this.prt_getFontHtmlStyle(font, scale);
};

/**
 * font -> html style 변환.
 * @param {object} font 대상 font object
 * @param {number} scale 스케일 조정 값
 * @return {string} tag string
*/
LIB_PRINT.prt_getFontHtmlStyle = function(font, scale)
{	
	if ( this.gfn_isEmpty(font) ) return "";
	
	var tag = "";
	
	// check cache (scale 포함)
	var cacheName = font.toString().replace(/\s/g, "_") + "_" + scale;	
	var cache = this.gfn_getUserProperty(application, "formPrintStyleCache");
	var fontCache = cache[cacheName];
	if ( !this.gfn_isUndefined(fontCache) )
	{
		return fontCache;
	}
	
	var fontSize = font.size;
	var fontType = font.type;
	var fontFace = font.face;
	
	if ( scale < 1 )
	{
		fontSize = Math.floor(fontSize * scale);
	}	
	
	// antialias 제거
	fontType = fontType.replace("antialias", "");
	
	// italic
	if ( fontType.indexOf("italic") > -1 )
	{
		tag += " font-style:italic;";
		
		fontType = fontType.replace("italic", "");
	}
	
	// underline
	var underline = false;
	if ( fontType.indexOf("underline") > -1 )
	{
		underline = true;
		
		fontType = fontType.replace("underline", "");
	}
	
	// strikeout
	var strikeout = false;
	if ( fontType.indexOf("strikeout") > -1 )
	{
		strikeout = true;
		
		fontType = fontType.replace("strikeout", "");
	}
	
	if ( underline )
	{
		if ( strikeout )
		{
			tag += " text-decoration:underline line-through;";
		}
		else
		{
			tag += " text-decoration:underline;";
		}
	}
	else if ( strikeout )
	{
		tag +=  " text-decoration:line-through;";
	}
	
	fontType.replace(/\s/g, "");
	
	if ( this.gfn_isEmpty(fontType) )
	{
		fontType = "normal";
	}
	tag +=  " font-weight:"+fontType+";";
	
	if ( !isNaN(fontSize) && this.gfn_isNumber(fontSize) )
	{
		tag +=  " font-size:"+fontSize+"pt;";
	}	
	
	if ( !this.gfn_isEmpty(fontFace) )
	{
		tag +=  " font-family:"+fontFace+";";
	}
	
	// cache 등록
	cache[cacheName] = tag;	

	return tag;
};

/**
 * 대상 컴포넌트의 color -> html style 변환.
 * @param {XComp} color 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getColorHtmlStyleByComp = function(comp)
{
	// currentstyle 값으로 null 을 반환하는 컴포넌트 존재함.
	var color = comp.currentstyle.color;
	if ( !color )
	{
		color = comp.on_find_CurrentStyle_color("normal");
	}	

	return this.prt_getColorHtmlStyle(color);
};

/**
 * color -> html style 변환.
 * @param {object} color 대상 color object
 * @return {string} tag string
*/
LIB_PRINT.prt_getColorHtmlStyle = function(color)
{
	if ( this.gfn_isEmpty(color) ) return "";
	
	var tag = "";
	
	color = color.value;
	
	if ( '#' == color.charAt(0) )
	{
		color = color.substr(0,7);
	}
	
	tag += " color:"+color+";";
	
	return tag;
};

/**
 * 대상 컴포넌트의 wordwrap -> html style 변환.
 * @param {XComp} comp 대상 Component
 * @return {string} tag string
*/
LIB_PRINT.prt_getWordWrapHtmlStyleByComp = function(comp)
{
	var tag = "";
	var wordWrap = comp.wordwrap;
	
	if ( !this.gfn_isUndefined(wordWrap) )
	{
		tag = this.prt_getWordWrapHtmlStyle(wordWrap);
	}
	return tag;
};

/**
 * wordwrap -> html style 변환.
 * @param {string} wordwrap 대상 wordwrap string
 * @return {string} tag string
*/
LIB_PRINT.prt_getWordWrapHtmlStyle = function(wordwrap)
{
	var tag = "";

	wordwrap = this.gfn_isEmpty(wordwrap) ? "false" : wordwrap;
	wordwrap = nexacro._toBoolean(wordwrap);
	if ( wordwrap )
	{
		tag += " white-space:normal;";
		tag += " word-break:break-all;";
		tag += " word-wrap:break-word;";
	}
	else
	{
		tag += " white-space:nowrap;";
	}
	
	return tag;
};

/**
 * 컴포넌트의 전체 경로 반환
 * @param {string} url 대상 url string
 * @return {string} url string
*/
LIB_PRINT.prt_getCompFullName = function(comp)
{
	var compFullName = comp._unique_id;
	if ( this.gfn_isEmpty(compFullName) )
	{
		compFullName = this.gfn_getPathName(comp).replace(/\./g, "_")
	}
	return compFullName;
};

/**
 * image 실제 경로 반환
 * @param {string} url 대상 url string
 * @return {string} url string
*/
LIB_PRINT.prt_getImageRealPath = function(url)
{
	if (!url) return null;
	if (url.substring(0, 4).toLowerCase() == "url(")
	{
		url = url.substring(5, url.length - 2);                
	}

	if (!url)
		return null;

	var refUrl= this._getRefFormBaseUrl();
	var imgUrl = "";
	
	if ( application._getImageLocation )
	{
		imgUrl = application._getImageLocation(url, refUrl);
	}
	else
	{
		imgUrl = nexacro._getImageLocation(url, refUrl);
	}
	
	return imgUrl;
};

/**
 * Control 등 복합컴포넌트의 내부 컴포넌트의
 * tag 를 얻어오기 위한 대체 컴포넌트 반환
 * @param {string} compName 대상 Component 명
 * @return {XComp} Component
*/
LIB_PRINT.prt_getPrintFormProxyComp = function(compName)
{
	var name = "_FormPrintProxy"+compName;
	var comp = this.printTargetContainer.components[name];
	if ( this.gfn_isEmpty(comp) )
	{
		comp = new nexacro[compName]();
		comp.init(name, "absolute", 0, 0, 0, 0);
		this.printTargetContainer.addChild(comp.name, comp);
		comp.show();
	}
	
	comp.move(0, 0, 0, 0);
	comp.set_visible(false);
	
	return comp;
};

/**
 * html 특수문자 변환
 * @param {string} str 대상 문자열
 * @return {string} 변환된 문자열
*/
LIB_PRINT.prt_replaceHtmlSpecialChar = function(str)
{
	if ( this.gfn_isEmpty(str) )
	{
		return "";
	}
	
	str = str.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/'/g, "&apos;")
			.replace(/\"/g, "&quot;")
			.replace(/\t/g, "&emsp;")
			.replace(/\r\n/g, "<br>")
			.replace(/\r/g, "<br>")	
			.replace(/\n/g, "<br>");	
	
	return str;
};

/**
 * ChildFrame에 속한 계층 위치의 정보까지 명칭으로 얻는다.
 * @param {component} obj nexacro component.
 * @param {XComp=} refParent 계층 구조에서 중단할 상위 nexacro component
 * @return {string} obj 계층 구조의 명칭(xpform.Div00.Button01)
 * @example
 *
 * // obj = Button
 * trace(this.gfn_getPathName(obj, this));
 * // output : Button00
 *
 * trace(this.gfn_getPathName(Div00.st_test, this));
 * // output : Div00.st_test
 *
 * @memberOf this
 */
LIB_PRINT.gfn_getPathName = function(obj, refParent)	
{
	var c = obj, arr = [];			
	while ( c )
	{
		if ( c instanceof ChildFrame ) break;
		if ( refParent && c === refParent ) break;
		arr.push(c.name);
		c = c.parent;
	}
	arr = arr.reverse();
	return arr.join(".");
};

/**
 * 배열 항목의 필드를 기준으로 배열 항목을 정렬 처리한다.<br>
 * 배열의 각 항목은 하나 이상의 속성을 가진 객체이고,<br>
 * 모든 객체에는 최소한 하나 이상의 공통 속성을 가지며,<br>
 * 이 값은 배열 항목을 정렬하는데 사용된다.<br>
 * 매개변수가 여러개인 경우에는 첫번째 필드는 1차, 두번째 필드는 다음 정렬 필드로 사용된다.
 * @param {array} array 대상 Array.
 * @param {string...} 정렬 기준 필드명.
 * @return {array} Sort 처리된 Array.
 * @example
 * var users = [];
 * users[0] = {id:"milk", name:"park", age:33};
 * users[1] = {id:"apple", name:"kim"};
 * users[2] = {id:"oops", name:"joo", age:44};
 * users[3] = {id:"beans", name:"lee", age:50};
 * users[4] = {id:"zoo", age:65};
 * users[5] = {id:"milk", name:"", age:33};
 * users[6] = {id:"milk", name:"lee", age:33};	
 * var sorted = this.gfn_sortOn(users, "name","id");
 * for(var i=0; i < sorted.length; i++)
 * {
 * 	var tmp = sorted[i];
 * 	trace("name:" + tmp.name + " || id:" + tmp.id + " || age:" + tmp.age);
 * 	// output : name: || id:milk || age:33
 * 	// output : name:joo || id:oops || age:44
 * 	// output : name:kim || id:apple || age:undefined
 * 	// output : name:lee || id:beans || age:50
 * 	// output : name:lee || id:milk || age:33
 * 	// output : name:park || id:milk || age:33
 * 	// output : name:undefined || id:zoo || age:65
 * }
 * @memberOf this
 */
LIB_PRINT.gfn_sortOn = function(array)
{
	var arr, i,
		args = [];
		
	arr = array.slice(0);
	if (!arguments.length) 
	{
		return arr.sort();
	}
	
	for (i = 0; i < arguments.length; i++) 
	{
		args.push(arguments[i]);
	}

	return arr.sort(function (a, b) 
	{
		var compareProp, prop,
			i0, i1;
		
		compareProp = args.slice(0);
		prop = compareProp.shift();
		
		while (a[prop] == b[prop] && compareProp.length)
		{
			prop = compareProp.shift();
		}
		
		i0 = a[prop];
		i1 = b[prop];
	
		if (i0 === undefined && i1 !== undefined)
		{
			return 1;
		}
		else if (i0 !== undefined && i1 === undefined)
		{
			return -1;
		}
		
		return i0 == i1 ? 0 : i0 > i1 ? 1 : -1;
	});
};

/**
 * 배열의 각 항목에 대해 주어진 콜백 함수를 호출한다.<br>
 * 주어진 함수에서 return false 처리 되면 임의 배열 항목에서 반복이 멈춘다.
 * @param {array} array 처리 대상 Array.
 * @param {function} func callback 함수. 
 * @param {object=} scope callback 함수에 대한 수행 scope.
 * @param {boolean=} reverse 반복순서 (default: false).
 * @return {boolean | number} 배열 항목 모두가 처리되면 true를 리턴, 함수 처리중에 return false를 하게 되면 false 처리된 배열 index를 리턴.
 * @example
 * var mon = ["Jan","Feb","Mar","Apr"];
 * var result = this.gfn_Each(mon, function(name, index) {
 * 	trace(index + "==>" + name);
 *	// output : 0==>Jan
 *	// output : 1==>Feb
 *	// output : 2==>Mar
 *	// output : 3==>Apr
 * });
 * trace(result);	// output : true
 *
 * var result = this.gfn_Each(mon, function(name, index) {
 *	trace(index + "==>" + name);
 *	// output : 0==>Jan
 *	// output : 1==>Feb
 *	if (name === 'Mar') 
 *	{
 *		trace("break here!");
 *		// output : break here!
 *		return false;
 *	}
 * });
 * trace(result);	// output : 2
 * @memberOf this
 */
LIB_PRINT.gfn_Each = function(array, func, scope, reverse)
{
	var i, len = array.length;

	if (reverse !== true) 
	{
		for (i = 0; i < len; i++) 
		{
			if (func.call(scope || array[i], array[i], i, array) === false) 
			{
				return i;
			}
		}
	}
	else 
	{
		for (i = len - 1; i > -1; i--) 
		{
			if (func.call(scope || array[i], array[i], i, array) === false) 
			{
				return i;
			}
		}
	}

	return true;
};

/**
 * 지정된 항목이 처음 나오는 배열 위치를 반환한다. 
 * @param {array} array 검색 대상 Array.
 * @param {object} item 찾고자 하는 Item.
 * @param {number=} from 검색의 시작 위치 (default: 0).
 * @param {boolean=} strict true: 형변환 없이 비교('==='), false: 형변환 후 비교('==') (default: false).
 * @return {number} 검색된 배열 위치. 없다면 -1 리턴.
 * @example
 * var mon = ["Jan","Feb","Mar","Apr"];
 * var index = this.gfn_indexOf(mon, "Mar");
 * trace("index==>" + index);	// output : index==>2
 * var index = this.gfn_indexOf(mon, "May");
 * trace("index==>" + index);	// output : index==>-1
 * @memberOf this
 */
LIB_PRINT.gfn_indexOf = function(array, item, from, strict)
{
	var len = array.length;
	if ( from == null ) from = 0;;
	strict == !!strict;
	from = (from < 0) ? Math.ceil(from) : Math.floor(from);
	if (from < 0)
	{
		from += len;
	}
	
	if (strict)
	{
		for (; from < len; from++) 
		{
			if ( array[from] === item)
			{
				return from;
			}
		}
	}
	else
	{
		for (; from < len; from++) 
		{
			if ( array[from] == item)
			{
				return from;
			}
		}
	}
	
	return -1;
};

/**
 * value의 nexacro component 여부 반환.
 * @param {*} value 확인할 value.
 * @return {boolean} nexacro component 여부.
 * @example
 * var a = new Button();
 * trace(this.gfn_isXComponent(a));	// output : true
 *
 * var a = new Dataset();
 * trace(this.gfn_isXComponent(a));	// output : false
 *
 * var a = new String();
 * trace(this.gfn_isXComponent(a));	// output : false
 *
 * @memberOf Eco
 */
LIB_PRINT.gfn_isXComponent = function(value)
{
	if ( value === null || value === undefined  ) return false;
	
	return value instanceof nexacro.Component;
};

/**
 * 주어진 nexacro 개체의 type 을 반환
 * @public
 * @param {*} obj Object, Component, Frame, .. 등 nexacro 모든 개체
 * @return {string} 개체의 type
 * @example
 * trace(this.gfn_typeOf(Button00));	// output : Button
 * trace(this.gfn_typeOf(Tab00));	// output : Tab
 * trace(this.gfn_typeOf(Tab00.tabpage1));	// output : Tabpage
 * trace(this.gfn_typeOf(Dataset00));	// output : Dataset
 * trace(this.gfn_typeOf(PropertyAnimation00));	// output : PropertyAnimation
 *
 * var o;
 * o = new Buffer;
 * trace(this.gfn_typeOf(o));	// output : Buffer
 *
 * o = new DomDocument;
 * trace(this.gfn_typeOf(o));	// output : DomDocument
 *
 * o = new Rect;
 * trace(this.gfn_typeOf(o));	// output : Rect
 *
 * o = new FileDialog;
 * trace(this.gfn_typeOf(o));	// output : FileDialog
 *
 * o = new UserEvent;
 * trace(this.gfn_typeOf(o));	// output : UserEvent
 *
 * // non XP Component/Object return undefined.
 * o = {};
 * trace(this.gfn_typeOf(o));	// output : undefined		 
 *
 * o = new Date();
 * trace(this.gfn_typeOf(o));	// output : undefined
 * @memberOf this
 */
LIB_PRINT.gfn_typeOf = function(obj)
{
	var type;
	if ( obj && (typeof obj == "object"))
	{
		var s = obj.toString();
		if(s == "[object Object]") return type;
		
		type = s.substr(8, s.length-9);
	}
	return type;
};

/**
 * 배열의 모든 항목에 대한 합계를 구한다.
 * @param {array} array 처리 대상 배열.
 * @param {number} start 배열 시작 index.
 * @param {number} len 계산할 배열 length.
 * @return {number} sum value.
 * @example
 * var counts = [2, 10, 5, 1];
 * var sum = this.gfn_sum(counts);
 * trace("sum==>" + sum);	// output : min==>18
 * @memberOf this 
 */
LIB_PRINT.gfn_sum = function(array, start, len) 
{
	if ( start == null ) start = 0;
	if ( len == null ) len = array.length;
	var sum = 0;
	for (var i=start ; i<len; sum+=array[i++]);
	return sum;
};

/**
 * 주어진 문자열을 n회 반복해서 반환한다.
 * @param {string} str 반복할 문자열.
 * @param {number} count 반복 횟수.
 * @return {string} 반복된 문자열
 * @example
 * var str = "0";
 * var result = this.gfn_repeatStr(str, 4);
 * trace(result); // output : 0000
 * @memberOf Eco.string
 */
LIB_PRINT.gfn_repeatStr = function(str, count)
{
	var rtn = "".padLeft(count, str);
	return rtn;
};

/**
 * value의 number 여부 반환.
 * @param {*} value 확인할 value.
 * @return {boolean} number 여부.
 * @example
 * trace(this.gfn_isNumber(1234));	// output : true
 * trace(this.gfn_isNumber("1234"));	// output : false		 
 * @memberOf this
 */
LIB_PRINT.gfn_isNumber = function(value)
{
	return typeof value === 'number' && isFinite(value);
};

/**
 * nexacro Component의 Padding Size를 반환한다.
 * @param {Component} nexacro Component
 * @return {array.<number>} [ leftSize, topSize, rightSize, bottomSize ]
 * @example
 * trace(this.gfn_getPadding("전체 padding = 0")); //output: [0,0,0,0] 
 * trace(this.gfn_getPadding("left padding = 20")); //output: [20,0,0,0] 
 *
 * @memberOf this
 */
LIB_PRINT.gfn_getPadding = function(xComp)
{
	var padding = xComp.currentstyle.padding;
	var leftSize = 0, topSize = 0, rightSize = 0, bottomSize = 0;

	if ( padding )
	{
		topSize    = (isNaN(padding.top) ? 0 : padding.top);
		bottomSize = (isNaN(padding.bottom) ? 0 : padding.bottom);
		leftSize   = (isNaN(padding.left) ? 0 : padding.left);
		rightSize  = (isNaN(padding.right) ? 0 : padding.right);
	}
	
	return [leftSize, topSize, rightSize, bottomSize];
};

/**
 * nexacro Component의 boder width를 반환한다.
 * @param {Component의} nexacro Component
 * @return {array.<number>} [ leftWdith, topWdith, rightWdith, bottomWdith ]
 * @example
 * trace(this.gfn_getBorderWidth("border style이 none이거나 width가 0일 경우")); //output: [0,0,0,0] 
 * trace(this.gfn_getBorderWidth("border가 1인 component")); //output: [1,1,1,1]
 *
 * @memberOf this
 */
LIB_PRINT.gfn_getBorderWidth = function(Comp)
{
	var currentBorder = Comp.currentstyle.border;
	if (currentBorder)
	{
		var leftWidth = 0,topWidth = 0,rightWidth = 0,bottomWidth = 0;
		leftWidth = currentBorder.left_width;
		topWidth = currentBorder.top_width;
		rightWidth = currentBorder.right_width;
		bottomWidth = currentBorder.bottom_width;
		
		leftWidth = this.gfn_isNull(leftWidth) ? "0" : leftWidth;
		topWidth = this.gfn_isNull(topWidth) ? "0" : topWidth;
		rightWidth = this.gfn_isNull(rightWidth) ? "0" : rightWidth;
		bottomWidth = this.gfn_isNull(bottomWidth) ? "0" : bottomWidth;
		
		leftWidth   = nexacro.toNumber(leftWidth.replace("px",""));
		topWidth    = nexacro.toNumber(topWidth.replace("px",""));
		rightWidth  = nexacro.toNumber(rightWidth.replace("px",""));
		bottomWidth = nexacro.toNumber(bottomWidth.replace("px",""));
		
		return [leftWidth, topWidth, rightWidth, bottomWidth];
	}
	else
	{
		return [0, 0, 0, 0];
	}
};

/**
 * Hexadecimal code를 [r, g, b, a]로 변환한다.
 * @param {string} str "red"같이 named color나, "#000000", "#000000ff" 값들이 주어진다.
 * @return {array} [r, g, b, a] 형태의 array 값.
 * @example
 * trace(this.gfn_hexToRgb("#FF8C00")); //output: [255,140,0]
 * @memberOf this
 */
LIB_PRINT.gfn_hexToRgb = function(str)
{
	if(this.gfn_isNull(str)) {
		alert("Arguments is empty!");
		return;
	}
	
	if ( !(str.match(/^#[0-9a-f]{3,8}$/i)) )
	{
		str = nexacro._xreNamedColorList[str];
	}
	
	var hex;
	if ( str.length == 9 )
	{
		hex = str.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})(\w{1,2})$/);
	}
	else
	{
		hex = str.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
	}
	if (hex.length >= 4)
	{
		var rgb = [0, 0, 0];
		for (var i = 0; i < 3; i++)
		{
			var value = hex[i + 1];
			rgb[i] = parseInt(value.length == 1
					? value + value : value, 16) ;
		}
		if ( hex[4] && hex[4].length > 0 )
		{
			rgb.push(parseInt(hex[4], 16) );
		}
		else
		{
			rgb.push(255);			
		}
		return rgb;
	}
};

/**
 * RGB를 Hexadecimal code로 변환한다.
 * @param {number} red red.
 * @param {number} green green.
 * @param {number} blue blue.
 * @param {number=} alpha alpha.
 * @return {string} Hexadecimal code.
 * @example
 * trace(this.gfn_rgbToHex(255,140,0)); //output: #FF8C00
 * trace(this.gfn_rgbToHex(255,140,0, 100)); //output: #FF8C0064
 *
 * @memberOf this
 */
LIB_PRINT.gfn_rgbToHex = function(red,green,blue,alpha)
{
	var numberToHex = this.numberToHex(red);
	numberToHex += this.numberToHex(green);
	numberToHex += this.numberToHex(blue);
	numberToHex += this.numberToHex(alpha);
	
	return "#" + numberToHex;
};

/**
 * number를 Hexadecimal code로 변환한다.
 * @private
 * @param {number} value 변환대상.
 * @return {number} Hexadecimal.
 * @memberOf this
 */
LIB_PRINT.numberToHex = function(value)
{
	if(this.gfn_isEmpty(value)) return "";
	
	var hex = value.toString(16).padLeft(2,"0");
	//trace("value="+value+" , hex="+hex);
	return hex.toUpperCase();
};

/**
 * value의 undefined 여부 반환.
 * @param {*} value 확인할 value.		 
 * @return {boolean} undefined 여부.
 * @example
 * var a;
 * trace(this.gfn_isUndefined(a));	// output : true
 *
 * var a = "";
 * trace(this.gfn_isUndefined(a));	// output : false
 * @memberOf this
 */
LIB_PRINT.gfn_isUndefined = function(value)
{
	return value === undefined;
};