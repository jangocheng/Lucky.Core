﻿/**
* 城市选择器组件
*/
define(function (require, exports, module) {
    return function (jQuery) {
        (function ($) {
            $.fn.gCity = function (option) {

                /**
                 * gomeCity主函数
                 * @@param  {Object} $this  [绑定事件源多项]
                 * @@param  {Object} option [组件属性设置]
                 */
                var gomeCity = function ($this, option) {
                    /*当前选中区域存储器:省名称、省编号；市名称、市编号；县名称、县编号；镇名称、镇编号；完整地址 */
                    this.cache = { "snam": "", "sid": "", "cnam": "", "cid": "", "xnam": "", "xid": "", "znam": "", "zid": "", "chtm": "" };

                    /* 存储地址解析：三级Code|全称|二级Code|一级Code|四级Code */
                    this.adress = "22040900|浙江省金华市永康市东城街道|22040000|22000000|220409001";

                    this.opt = option;
                    this.obj = $this;
                    this.init();
                };
                gomeCity.prototype = {
                    init: function () {
                        var _this = this;
                        _this.winClose();
                        _this.obj.click(function () {
                            _this.bindEvent();
                            _this.obj.addClass("gctCur").parent().addClass('cityShow');
                            if (_this.opt.gc_new) _this.opcity(1);
                            _this.winType(true);
                        });
                        _this.autoProvince();
                    },

                    /**自动获取省级列表信息 */
                    autoProvince: function () {
                        var _this = this,
                            _parm = {};
                        $.ajax({
                            type: "get",
                            url: _this.opt.gc_url_province,
                            cache: true,
                            dataType: "jsonp",
                            data: _parm,
                            jsonpCallback: "g",
                            jsonpName: "g",
                            success: function (data) {
                                _this.cityModel(data);
                            }
                        });
                    },

                    bindEvent: function () {
                        var _this = this;
                        $(_this.opt.gc_shw).unbind("click").click(function (e) { _this.cityClick(_this.getEvent(e)); });
                    },

                    /**
                     * 初始化时生成组件模型
                     * @@param  {Object} data [返回的城市数据]
                     */
                    cityModel: function (data) {
                        /* 默认全地址数据 */
                        var cdata = this.opt.gc_dat;
                        cdata = cdata || this.adress;
                        cdata = cdata.split("|");
                        /* 如果没有第四级 则默认为第四级第一个城镇 9位 */
                        if (cdata.length != 5 || cdata[4] == "undefined") cdata[4] = cdata[0] + "1";
                        /* 初始化this.cache区域存储器 */
                        this.cache.sid = cdata[3];
                        this.cache.cid = cdata[2];
                        this.cache.xid = cdata[0];
                        this.cache.zid = cdata[4];
                        this.cityDom(data, 2, 1);
                    },

                    /**
                     * 生成控件内容
                     * @@param  {Object} data    [当前城市数据源]
                     * @@param  {Number} nextTyp [下一级标识]
                     * @@param  {Number} cid     [当前级别编号]
                     */
                    cityDom: function (data, nextTyp, cid) {
                        var _ctdat = data.citys || data;
                        if (cid == 1) {
                            this.createProvince(_ctdat, nextTyp);
                        } else {
                            this.createOthers(_ctdat, cid, nextTyp);
                        }

                        /* 当第四级区域只有一个可选地址时触发 非第一次请求执行 */
                        if (!this.opt.gc_inp && _ctdat.length <= 1 && nextTyp == 4) this.inpcity();

                        /* 自动写入指定地址到页面地址显示框 */
                        if (this.opt.gc_inp && nextTyp == 4) {
                            this.opt.gc_inp = false;
                            this.citySlect();
                            this.cache.chtm = this.fmtAddress();
                            if (this.opt.gc_ads) $(this.opt.gc_aid).html(this.cache[this.opt.gc_ads]).attr("title", this.cache[this.opt.gc_ads]);
                            if (this.opt.gc_autofn) this.opt.gc_autofn.apply(this.cache);
                        }

                        this.bindEvent();
                    },

                    /**
                     * 检测返回数据的有效性
                     * @@param  {Object}  _ctdat [城市信息数据源]
                     * @@return {Boolean}        [验证结果T or F]
                     */
                    checkData: function (_ctdat) {
                        try {
                            var _dn = _ctdat.result.division,
                                _id = _dn[0].code + _dn[0].label;
                            return true;
                        } catch (Exception) {
                            if (window.console) {
                                console.log('\u54CD\u5E94\u6570\u636E\u5F02\u5E38\r\n' + Exception);
                            }
                            return false;
                        }
                    },

                    /**
                     * 创建一级区域
                     * @@param  {Object} _ctdat  [当前城市数据源]
                     * @@param  {Number} nextTyp [下一级标识]
                     */
                    createProvince: function (_ctdat, nextTyp) {
                        if (!this.checkData(_ctdat)) return false;
                        var _this = this,
                            _cthtm = '';
                        _ctdat = _ctdat.result.division;
                        $.each(_ctdat, function (i, c) {
                            var _cid = c.code,
                                _cnm = c.label,
                                _sty = '';
                            if (_cid == _this.cache.sid) {
                                //_sty = 'class="select"';选中效果
                                _this.cache.snam = _cnm;
                            }
                            _cthtm += _this.createSpan(_sty, _cnm, _cid, (_cid + ',' + nextTyp + ',1'));
                        });
                        _this.cityHtm(_cthtm);
                    },

                    /**
                     * 生成二级、三级或四级区域 [cid说明：请求二级时cid为一级编号]
                     * @@param  {Object} _ctdat  [当前城市数据源]
                     * @@param  {Number} cid     [当前级别编号]
                     * @@param  {Number} nextTyp [下一级标识]
                     */
                    createOthers: function (_ctdat, cid, nextTyp) {
                        if (!this.checkData(_ctdat)) return false;
                        var _this = this,
                            _cthtm = '',
                            _ctyid = '',
                            _ctynm = '',
                            _cdata = _ctdat;
                        _ctdat = _ctdat.result.division;
                        /* 遍历当前级别的内容 */
                        $.each(_ctdat, function (i, c) {
                            var _cid = c.code,
                                _cnm = c.label,
                                _rid = c.relationCode || null,/* 三级区域合并特定字段 */
                                _sty = '';
                            _ctyid = _cid;
                            _ctynm = _cnm;
                            /* 如果是二级 */
                            if (_cid == _this.cache.cid) {
                                //_sty='class="select"';//选中效果
                                _this.cache.cnam = _cnm;
                            }
                            /* 如果是三级 (兼容三级区域合并) */
                            if ((_cid == _this.cache.xid && !_rid) || (_cid != _this.cache.xid && _rid && _rid == _this.cache.xid)) {
                                //_sty='class="select"';//选中效果
                                _this.cache.xid = _cid;//强制将xid重写
                                _this.cache.xnam = _this.fmt(_cnm);
                            }
                            /* 如果是四级  向后兼容处理：兼容老版中只有三级地区的情况 */
                            if (_this.cache.zid && _this.cache.zid != "" && _cid == _this.cache.zid) {
                                //_sty='class="select"';//选中效果
                                _this.cache.znam = _this.fmt(_cnm);
                            }
                            _cthtm += _this.createSpan(_sty, _cnm, _cid, (_cid + ',' + (parseInt(nextTyp) + 1) + ',' + nextTyp), _rid);
                        });
                        $("#ctbox_" + nextTyp).html(_cthtm);

                        /* 缓存市级数据 获取县级数据 _this.cache.cid：所属城市ID  nextTyp+1：下一级别  nextTyp：当前级别 */
                        var cacheID = 0;
                        if (nextTyp == 2) {
                            cacheID = _this.cache.sid;
                            if (_this.opt.gc_inp) _this.autoAjax(_this.cache.cid, parseInt(nextTyp) + 1, nextTyp);

                            /* 当二级城市为直辖市时处理 */
                            if (!_this.opt.gc_inp && _ctdat.length <= 1) {
                                _this.cache.cid = _ctyid;
                                _this.autoAjax(_this.cache.cid, parseInt(nextTyp) + 1, nextTyp);
                            }
                        }
                        /* 缓存县级&获取城镇级数据 */
                        if (nextTyp == 3) {
                            cacheID = _this.cache.cid;
                            if (_this.opt.gc_inp) _this.autoAjax(_this.cache.xid, parseInt(nextTyp) + 1, nextTyp);
                        }
                        /* 缓存城镇 */
                        if (nextTyp == 4) {
                            cacheID = _this.cache.xid;
                            if (_ctdat.length <= 1) {
                                _this.cache.zid = _ctyid;
                                _this.cache.znam = _ctynm;
                            }
                        }
                        /* 缓存数据 */
                        _this.obj.data("data" + cacheID, _cdata);
                    },

                    /**
                     * 自动获取对应分级内容
                     * @@param  {[type]} cid     [区域ID]
                     * @@param  {[type]} nextTyp [下一级标识]
                     * @@param  {[type]} rank    [当前级别]
                     */
                    autoAjax: function (cid, nextTyp, rank) {
                        var _this = this;
                        window.setTimeout(function () { _this.cityajax(cid, nextTyp, rank); }, 1);
                    },

                    /**
                     * 生成每级分类内容
                     * @@param  {String} sty     [样式名称]
                     * @@param  {String} cnm     [城市名称]
                     * @@param  {Number} cid     [城市编号]
                     * @@param  {String} dataVal [节点DataVal属性值]
                     * @@param  {Number} _rid    [三级区域合并特定字段]
                     * @@return {String}         [组装好的SPAN节点内容]
                     */
                    createSpan: function (sty, cnm, cid, dataVal, _rid) {
                        if (_rid) _rid = 'data-rid="' + _rid + '"';
                        return '<span><a href="javascript:;" ' + sty + ' title="' + cnm + '" id="ct' + cid + '" data-val="' + dataVal + '" ' + (_rid ? _rid : "") + '>' + cnm + '</a></span>';
                    },

                    /* 第一次完整请求后自动写入填充“请选择”中的城市地址 */
                    citySlect: function () {
                        $("#pct_1").find("b").html(this.cache.snam);
                        $("#pct_2").find("b").html(this.cache.cnam);
                        $("#pct_3").find("b").html(this.cache.xnam);
                        $("#pct_4").find("b").html(this.cache.znam);
                        /* 兼容第三级区域的后台数据删除修改 */
                        if (this.cache.xnam == "" || this.cache.xnam == undefined) {
                            /* 强制默认为北京  */
                            var _this = this;
                            _this.opt.gc_dat = _this.adress;
                            _this.opt.gc_inp = true;
                            window.setTimeout(function () { _this.init(); }, 1);
                            return false;
                        }
                    },

                    /**
                     * 组装控件HTML元素
                     * @@param  {String} _cthtm [已选择的城市名称]
                     */
                    cityHtm: function (_cthtm) {
                        var _sty = this.opt.gc_css,
                            _slt = "";
                        if (this.opt.gc_slt) {
                            _slt = '<div id="citySelect" class="gctSelect clearfix">\
            	<a href="javascript:;" id="pct_1" data-val="1" data-lnk><b></b><i></i></a>\
            	<a href="javascript:;" id="pct_2" data-val="2" data-lnk><b></b><i></i></a>\
            	<a href="javascript:;" id="pct_3" data-val="3" data-lnk><b></b><i></i></a>\
            	<a href="javascript:;" id="pct_4" data-val="4" data-lnk class="cur"><b></b><i></i></a>\
            	<a href="javascript:;" id="cityClose" class="close"></a></div>';
                        }
                        var _chtm = '<div id="cityMBox">\
            	<div class="'+ _sty + '" id="ctbox_1">' + _cthtm + '</div>\
            	<div class="'+ _sty + '" id="ctbox_2"></div>\
            	<div class="'+ _sty + '" id="ctbox_3"></div>\
            	<div class="'+ _sty + '" id="ctbox_4"></div></div>';
                        $(this.opt.gc_shw).html(_slt + _chtm);
                        /*自动获取市级*/
                        this.autoAjax(this.cache.sid, 2, 1);
                    },

                    /**
                     * 控件点击处理
                     * @@param  {Object} entDom [事件对象]
                     */
                    cityClick: function (entDom) {
                        var linkDom = $(entDom),
                            linka = linkDom.parent(),
                            _this = this,
                            linkType = true;
                        if (linka.attr("data-lnk") || linka.attr("data-lnk") == "") {
                            linkType = false;
                        } else {
                            if (linkDom.attr("data-lnk") || linkDom.attr("data-lnk") == "") { linkType = false; }
                        }
                        if (linka.parent().hasClass("gctBox")) linka.parent().find("a").removeClass("select");
                        if (linkType) {
                            if (linkDom.attr("id") && linkDom.attr("id") == "cityClose") { _this.closeCity(); return false; }
                            var _ldat = linkDom.attr("data-val"),
                                _rank = 1;/* 当前区域级别标识 */
                            if (_ldat != undefined) {
                                /*linkDom.addClass("select");//设置点击选中效果*/
                                $(_this.opt.gc_shw).unbind("click");
                                _ldat = _ldat.split(",");/* 结构说明：data-val="15030000,4,3"  cid,下一级标识,当前级别标识 */
                                _rank = _ldat[2];
                                var _cityID = _ldat[0], _cityNm = _this.fmt($("#ct" + _cityID).html());
                                /* 一级区域点击 */
                                if (_rank == 1) {
                                    _this.cache.snam = _cityNm;
                                    _this.cache.sid = _cityID;
                                    _this.setLoading("#ctbox_2,#ctbox_3,#ctbox_4", _ldat);
                                }
                                /* 二级区域点击 */
                                if (_rank == 2) {
                                    _this.cache.cnam = _cityNm;
                                    _this.cache.cid = _cityID;
                                    _this.setLoading("#ctbox_3,#ctbox_4", _ldat);
                                }
                                /* 三级区域点击 */
                                if (_rank == 3) {
                                    _this.cache.xnam = _cityNm;
                                    _this.cache.xid = _cityID;
                                    _this.setLoading("#ctbox_4", _ldat);
                                }
                                /* 末级区域点击 */
                                if (_rank == 4) {
                                    _this.cache.znam = _cityNm;
                                    _this.cache.zid = _cityID;
                                    _this.inpcity();
                                }
                            }
                        } else {
                            var _lval = linkDom.attr("data-val");
                            if (_lval == undefined) {
                                _this.opcity(linkDom.parent().attr("data-val"));
                            } else {
                                _this.opcity(_lval);
                            }
                        }
                        _this.winType(true);
                    },

                    /**
                     * 设置用户点击控件时的等待效果 emt选择器 data数据源
                     * @@param {Stirng} emt  [节点选择器ID]
                     * @@param {Object} data [数据源]
                     */
                    setLoading: function (emt, data) {
                        $(emt).html("加载中...");
                        this.cityajax(data[0], data[1], data[2]);
                    },

                    /* 关闭控件弹层 */
                    winClose: function () {
                        var _this = this;
                        $('body:first').click(function (e) {
                            var isOpen = $(_this.opt.gc_shw).attr("cityType");
                            if (isOpen == "true") {
                                var eDom = $(_this.getEvent(e)),
                                    eElm = eDom.attr("id");
                                if (!eDom.attr("cityType") && !eDom.parent().attr("cityType") && !eDom.parent().parent().attr("cityType") && !eDom.parent().parent().parent().attr("cityType") && !eDom.parent().parent().parent().parent().attr("cityType") && eElm != "stockaddress" && eElm != "address" && eDom.parent().attr("id") != "address") {
                                    _this.winType(false);
                                    _this.closeCity();
                                }
                            } else {
                                _this.closeCity();
                            }
                        });
                    },

                    /**
                     * cityType状态设置
                     * @@param  {Boolean} typ [状态设置]
                     */
                    winType: function (typ) {
                        $(this.opt.gc_shw).attr("cityType", "" + typ);
                    },

                    /**
                     * 获取城市信息请求
                     * @@param  {Number} cid     [当前所属上一级ID]
                     * @@param  {Number} nextTyp [要查询的级别]
                     * @@param  {Number} rank    [当前的级别]
                     */
                    cityajax: function (cid, nextTyp, rank) {
                        var nam = "",
                            cacheID = 0;
                        this.opcity(nextTyp);
                        if (rank == 1) {
                            this.setDataClk("#pct_2", true);
                            this.setDataClk("#pct_3,#pct_4", false);
                            nam = $("#ct" + this.cache.sid).html();
                            cacheID = this.cache.sid;
                            this.cache.snam = nam;
                        } if (rank == 2) {
                            this.setDataClk("#pct_3", true);
                            this.setDataClk("#pct_4", false);
                            nam = $("#ct" + this.cache.cid).html();
                            cacheID = this.cache.cid;
                            this.cache.cnam = nam;
                        } if (rank == 3) {
                            this.setDataClk("#pct_4", true);
                            nam = this.fmt($("#ct" + this.cache.xid).html());
                            cacheID = this.cache.xid;
                            this.cache.xnam = nam;
                        } if (rank == 4) {
                            nam = this.fmt($("#ct" + this.cache.zid).html());
                            this.cache.znam = nam;
                        }
                        $("#pct_" + rank).find("b").html(nam);
                        /* 从缓存读取数据 */
                        if (cacheID != 0) this.getDataCache(cacheID, nextTyp, cid);
                    },

                    /**
                     * 格式化地址
                     * @@param  {String} str [地址]
                     * @@return {String}     [处理后的地址]
                     */
                    fmt: function (str) {
                        if (str) return str.replace("*", "");
                    },

                    /**
                     * 格式化完整地址
                     * @@return {String} [处理后的地址]
                     */
                    fmtAddress: function () {
                        try {
                            return this.cache.snam + this.cache.cnam.replace(this.cache.snam, "") +
                                    this.cache.xnam.replace(this.cache.cnam, "").replace(this.cache.snam, "") +
                                    this.cache.znam.replace(this.cache.cnam, "").replace(this.cache.snam, "").replace("全部区域", "");
                        } catch (Exception) {
                            return "";
                        }
                    },

                    /**
                     * 设置”请选择“按钮可点击状态
                     * @@param {String} emt    [选择器]
                     * @@param {Boolean} clkTyp [是否可点击状态设置]
                     */
                    setDataClk: function (emt, clkTyp) {
                        if (!this.opt.gc_inp) {
                            if (clkTyp) {
                                $(emt).attr("data-clk", clkTyp).find("b").html("请选择");
                            } else {
                                $(emt).hide().attr("data-clk", clkTyp).find("b").html("请选择");
                            }
                        }
                    },

                    /**
                     * 从缓存中读取数据
                     * @@param  {Number} cacheID [缓存池Data编号]
                     * @@param  {Number} nextTyp [下一级标识]
                     * @@param  {Number} cid     [当前城市编号]
                     */
                    getDataCache: function (cacheID, nextTyp, cid) {
                        if (this.obj.data("data" + cacheID)) {
                            this.cityDom(this.obj.data("data" + cacheID), nextTyp, cacheID);
                            return false;
                        } else {
                            /* 从服务端读取二三四级数据 */
                            var ajaxUrl = "",
                                parmDat = { 'citycode': cid, 'levelid': nextTyp };
                            if (nextTyp == 2) {
                                ajaxUrl = this.opt.gc_url_city;
                            } else if (nextTyp == 3) {
                                ajaxUrl = this.opt.gc_url_county;
                            } else {
                                ajaxUrl = this.opt.gc_url_town;
                            }
                            this.getDataAjax(cid, nextTyp, ajaxUrl, parmDat);
                        }
                    },

                    /**
                     * 发送请求读取数据
                     * @@param  {Number} cid     [当前城市编号]
                     * @@param  {Number} nextTyp [下一级标识]
                     *@@param  {String} ajaxUrl [当前类型的请求地址]
                     * @@param  {Object} parmDat [Ajax请求的参数集合]
                     */
                    getDataAjax: function (cid, nextTyp, ajaxUrl, parmDat) {
                        var _this = this;
                        $.ajax({
                            type: "get",
                            url: ajaxUrl,
                            cache: true,
                            dataType: "jsonp",
                            data: parmDat,
                            jsonpCallback: "g",
                            jsonpName: "g",
                            success: function (data) {
                                _this.cityDom(data, nextTyp, cid);
                            }
                        });
                    },

                    /** 输出选择信息 */
                    inpcity: function () {
                        var _this = this,
                            _adshtml = "";
                        _this.cache.chtm = _this.fmtAddress();/* 组装全地址 */
                        _adshtml = _this.cache.chtm;
                        if (_this.opt.gc_ads) {
                            _adshtml = _this.cache[_this.opt.gc_ads];/* 根据需要显示地址 */
                        }
                        $("#pct_4").find("b").html(_this.cache.znam);
                        $(_this.opt.gc_aid).html(_adshtml).attr("title", _adshtml);;
                        _this.closeCity();
                        /* 将cache继承给回调函数使用 */
                        if (_this.opt.gc_evt) {
                            var defaultXid = _this.cache.xid;
                            //如果是该四级上一级为合并区域则执行
                            if ($("#ct" + _this.cache.zid).attr("data-rid")) defaultXid = $("#ct" + _this.cache.zid).attr("data-rid");
                            _this.opt.gc_evt.apply($.extend({}, _this.cache, { "xid": defaultXid }));
                        }
                        /* 将用户选择的地址保存到数据库中 */
                        if (_this.opt.gc_upd) {
                            try {
                                var _url = siteUrl + "/support/add.jsp",
                                    _dat = { method: 'general.updateDistrictCodeToProfile', params: JSON.stringify({ districtCode: _this.cache.zid, time: new Date().getTime() }) };
                                $.ajax({ type: "get", url: _url, data: _dat, dataType: "jsonp", jsonpCallback: "updCity", jsonpName: "updCity", success: function (data) { } });
                            } catch (e) { }
                        }
                    },

                    /**
                     * 设置当前显示级别
                     * @@param  {Number]} c [当前要显示的ID]
                     */
                    opcity: function (c) {
                        for (var i = 1; i < 5; i++) {
                            if (i == c) { $("#ctbox_" + i).show(); $("#pct_" + i).addClass("cur").show(); }
                            else { $("#ctbox_" + i).hide(); $("#pct_" + i).removeAttr("class"); }
                        }
                    },

                    /* 其他默认事件 */
                    getEvent: function (e) { e = e || window.event; return e.target || e.srcElement; },
                    closeCity: function () { this.obj.removeClass("gctCur").parent().removeClass('cityShow'); }
                };

                /**
                 * 请求城市地址URL
                 * @@type {Object}
                 * 将四个请求独立出来，已满足四个区域不同请求的需要
                 * 默认二三四级请求一样
                 */
                var siteUrl = "undefined" != typeof cityUrl ? cityUrl : "http://localhost:14723",
                    ajaxUrl = {
                        'province': siteUrl + '/SiteManager/Area/Droplet',
                        'city': siteUrl + '/SiteManager/Area/Droplet',
                        'county': siteUrl + '/SiteManager/Area/Droplet',
                        'town': siteUrl + '/SiteManager/Area/Droplet'
                    };

                /**
                 * 控件属性设置
                 * @@type {Object}
                 */
                var config = {
                    gc_url_province: ajaxUrl.province,	/* 省级信息请求地址 */
                    gc_url_city: ajaxUrl.city,		/* 市级信息请求地址 */
                    gc_url_county: ajaxUrl.county,		/* 县级信息请求地址 */
                    gc_url_town: ajaxUrl.town,		/* 镇级信息请求地址 */
                    gc_dat: null,	/* 用户默认地址数据  null默认读取cookie地址信息 */
                    gc_css: 'gctBox',
                    gc_shw: '.gCity',
                    gc_aid: '#stockaddress',
                    gc_ads: 'chtm',	/* 自动写入所需地址 只支持写入省市县其中任意一个 ，chtm为全地址，null为默认写入所有 */
                    gc_inp: true,	/* 切换城市是是否自动写入地址 默认第一次加载写入 */
                    gc_upd: false,	/* 是否自动将所选城市存入数据库中 true自动保存 false不保存 */
                    gc_slt: true,	/* 是否显示 请选择 按钮 */
                    gc_new: false,	/* 购物车新地址特殊设置默认显示第一级 其他版块勿用 */
                    gc_autofn: null,	/* 自动执行函数 */
                    gc_evt: null 	/* 点击执行函数 */
                }, option = $.extend(config, option);
                this.each(function () { new gomeCity($(this), option); });
            }
      })(jQuery);
    }
})