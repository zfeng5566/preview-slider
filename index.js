/*
 * @Description: 滑动器组件 用于展示卡片数据 预展示下一页
 * @Author: wangzhijie01
 * @Date: 2019-06-17 16:46:40
 * @LastEditors: wangzhijie01
 * @LastEditTime: 2019-06-18 11:25:23
 */
import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

export default class PreviewSlider extends React.PureComponent {
    static propTypes = {
        widthOfSiblingSlidePreview: PropTypes.number, // 下一页和下一页预显示宽度
        stealWidth: PropTypes.number, // 每次切换要偷取的宽度 为正数时当前页序号越大 上一页显示的宽度也多 负数则相反
        speed: PropTypes.number, // 切换效果用时 毫秒
        pageChange: PropTypes.func, // 切换页面执行的函数 接受两个参数 上一次显示页面的索引 当前页面的索引pageChange(oldIndex,newIndex)
        pageTranstionEnd: PropTypes.func, // 切换页面动画效果执行完毕后的执行的函数

    }

    static defaultProps ={
        widthOfSiblingSlidePreview: 18,
        stealWidth: 5,
        speed: 300,
        pageChange: () => {},
        pageTranstionEnd: () => {},
    }

    componentDidMount() {
        // 获取每个页面的宽度
        this.itemWidth = document.querySelector('.lm-swiper-contianer').children[0].offsetWidth;
        // 缓存页面的容器元素
        this.containerEl = document.querySelector('.lm-swiper-contianer');
        // 记录滑动开始时候的坐标和时间
        this.start = {};
        // 记录滑动结束的偏移量
        this.delta = {};
        // 上一次激活的页面索引
        this.oldPageIndex = 0;
        // 当前页面索引
        this.activeIndex = 0;
        // 当前容器的偏移量
        this.currentX = this.props.widthOfSiblingSlidePreview;
        // 是否正在进行动画
        this.slidding = false;
        for (const item of this.containerEl.children) {
            item.number = 0;
            item.addEventListener('touchstart', this.onTouchStart, false);
        }
        this.listenTransitionEnd();
    }

    componentWillUnmount() {
        this.removeTransitionHandle();
    }

    // 动画结束事件钩子函数
    transtionEndHandle=() => {
        this.slidding = false;
        this.props.pageTranstionEnd(this.oldPageIndex, this.activeIndex);
    }

    // 绑定动画结束事件
    listenTransitionEnd() {
        this.containerEl.addEventListener('webkitTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.addEventListener('msTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.addEventListener('oTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.addEventListener('otransitionend', this.transtionEndHandle, false);
        this.containerEl.addEventListener('transitionend', this.transtionEndHandle, false);
    }

    removeTransitionHandle() {
        this.containerEl.removeEventListener('webkitTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.removeEventListener('msTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.removeEventListener('oTransitionEnd', this.transtionEndHandle, false);
        this.containerEl.removeEventListener('otransitionend', this.transtionEndHandle, false);
        this.containerEl.removeEventListener('transitionend', this.transtionEndHandle, false);
    }

    // 触摸
    onTouchStart =(e) => {
        e.stopPropagation();
        e.preventDefault();
        const current = e.currentTarget.getAttribute('data-key');
        // 如果滑动的不是当前页 或者 正在进行滑动
        if (this.activeIndex !== Number(current)) {
            return;
        }
        e.currentTarget.addEventListener('touchmove', this.onTouchMove, false);
        e.currentTarget.addEventListener('touchend', this.onTouchEnd, false);
        e.currentTarget.addEventListener('touchcancel', this.onTouchCancel, false);
        this.containerEl.style.transitionDuration = '0ms';
        const touch = e.nativeEvent ? e.nativeEvent.touches[0] : e.touches[0];
        this.start = {
            // 初始化触碰坐标
            x: touch.pageX,
            y: touch.pageY,
            // 储存触碰时间
            time: +new Date(),
        };
    }

    // 移动
    onTouchMove = (e) => {
        const nativeEvent = e.nativeEvent || e;
        if (nativeEvent.touches.length > 1 || (nativeEvent.scale && nativeEvent.scale !== 1)) {
            return;
        }
        const touches = nativeEvent.touches[0];
        this.delta = {
            x: touches.pageX - this.start.x,
            y: touches.pageY - this.start.y,
        };
        let x;
        if (
            (this.activeIndex === 0 && this.delta.x > 0)
            ||
            (this.activeIndex === this.props.children.length - 1 && this.delta.x < 0)
        ) {
            x = this.currentX + this.delta.x / 3;
        } else {
            x = this.currentX + this.delta.x;
        }
        this.containerEl.style.transform = `translateX(${x}px)`;
    }

    // 触摸结束
    onTouchEnd = (e) => {
        e.stopPropagation();

        const duration = +new Date() - this.start.time;
        const isValidSlide =
        (Number(duration) < 250 && // if slide duration is less than 250ms
          Math.abs(this.delta.x) > 20) || // and if slide amt is greater than 20px
        Math.abs(this.delta.x) > this.itemWidth / 2; // or if slide amt is greater than half the width

        e.currentTarget.removeEventListener('touchmove', this.onTouchMove, false);
        e.currentTarget.removeEventListener('touchend', this.onTouchEnd, false);
        e.currentTarget.removeEventListener('touchcancel', this.touchcancel, false);
        if (!isValidSlide) {
            this.slide(this.activeIndex);
            return;
        }
        if (this.delta.x > 0 && this.activeIndex > 0) {
            this.oldPageIndex = this.activeIndex;
            this.slide(this.activeIndex - 1);
        } else if (this.delta.x < 0 && this.activeIndex < this.props.children.length - 1) {
            this.oldPageIndex = this.activeIndex;
            this.slide(this.activeIndex + 1);
        } else {
            this.oldPageIndex = this.activeIndex;
            this.slide(this.activeIndex);
        }
        this.start = {};
        this.delta = {};
        // this.currentX = this.currentX + this.delta.x;
    }

    // 触摸意外取消
    onTouchCancel = (e) => {
        e.currentTarget.removeEventListener('touchmove', this.onTouchMove, false);
        e.currentTarget.removeEventListener('touchend', this.onTouchEnd, false);
        e.currentTarget.removeEventListener('touchcancel', this.touchcancel, false);
        this.slide(this.activeIndex);
    }

    // 滑到指定的页面
    slide(index) {
        this.props.pageChange(this.oldPageIndex, this.activeIndex);
        this.activeIndex = index;
        this.slidding = true;
        this.currentX = this.props.widthOfSiblingSlidePreview - this.itemWidth * index + this.props.stealWidth * this.activeIndex;
        this.containerEl.style.transform = `translateX(${this.currentX}px)`;
        this.containerEl.style.transitionDuration = `${this.props.speed}ms`;
    }

    render() {
        const contianerStyle = {
            transform: `translateX(${this.props.widthOfSiblingSlidePreview}px)`,
            width: `${this.props.children.length}00%`,

        };
        const itemStyle = {
            width: `calc(${100 / this.props.children.length}% - ${this.props.widthOfSiblingSlidePreview * 2}px)`,

        };
        return (
            <div className="lm-swiper-wrap">
                <div className="lm-swiper-contianer" style={contianerStyle}>
                    {
                        React.Children.map(this.props.children, (child, i) => (
                            <div
                                data-key={i}
                                style={itemStyle}
                            >
                                {child}
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
}
