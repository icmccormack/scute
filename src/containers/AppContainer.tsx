import * as React from 'react';

import Navbar from './Navbar';
import Log from 'src/components/Log';
import Editor from 'src/components/Editor';
import Button from 'src/components/Button';
import Dragger from 'src/components/Dragger';
import {Shape} from 'src/shapes/Shape';
import {connect} from 'react-redux';

import './style/AppContainer.scss';
import {ActionType, createAction } from 'src/redux/Actions';

type State = {
    originX: number, 
    originY: number,
   
    translateX: number,
    initialTranslateX: number,

    translateY: number,
    initialTranslateY: number,
    
    scale: number
    
    mouseX: number,
    mouseY: number,
};

type Props = {
    defaultHeight: number,
    defaultWidth: number, 
    log: string, 
    frame: Array<Shape>,
    
    updateCode: Function, 
    runCode: Function,

};

class App extends React.Component<Props, State> { 
    readonly state: State;
    readonly props: Props;
    leftWrapper: any; 
    rightWrapper: any;
    canvasWrapper: any;
    
    constructor(props){
        super(props);
        this.state = { 
            originX: 0,
            originY: 0,
            translateX: 0,
            initialTranslateX: 0,
            translateY: 0,
            initialTranslateY: 0,
            scale: 1,
            mouseX: 0,
            mouseY: 0,
        }
        this.leftWrapper = React.createRef();
        this.rightWrapper = React.createRef();
        this.canvasWrapper = React.createRef();
    }

    adjustLeft = (pageX: number, pageY: number, dx: number, dy: number) => {
        let lNode = this.leftWrapper.current;
        let rNode = this.rightWrapper.current;
        if(lNode && rNode){
            lNode.style.width = pageX + "px";
            lNode.style.flexGrow = 0;
        }
    }

    resetCanvas = (event) => {
        this.setState({
            translateX: 0,
            initialTranslateX: 0,
            initialTranslateY: 0,
            translateY: 0,
            scale: 1,
        });
    }

	getViewBox(){
		return [
			this.state.originX,
			this.state.originY, 
			this.props.defaultWidth, 
			this.props.defaultHeight
		].join(" ");
    }
    
    getTransform(){
        return " translate(" + this.state.translateX + "px, " + this.state.translateY + "px) " + "scale(" + this.state.scale + ")";
        
    }

	zoomCanvas = (event: React.WheelEvent<HTMLDivElement>) => {
        const {
            pageX,
            pageY,
        } = event;

        let rightBounds = this.rightWrapper.current.getBoundingClientRect();
        let leftBounds = this.leftWrapper.current.getBoundingClientRect();
        let boundsWidth = (rightBounds.x > 0 ? leftBounds.width + rightBounds.width : rightBounds.width);

        let eventX = pageX - boundsWidth;
        let eventY = pageY - rightBounds.height;

        let change = event.deltaY/rightBounds.height;
        let newScale = this.state.scale + change * .5;

        let ratio = 1 - newScale/this.state.scale;

        this.setState({
            scale: newScale,
            translateX: this.state.translateX + (eventX - this.state.translateX) * ratio,
            translateY: this.state.translateY + (eventY - this.state.translateY) * ratio,
        });
     
    }

    dragCanvas = (pageX: number, pageY: number, dx: number, dy: number) => {
        this.setState({
            translateX: dx + this.state.initialTranslateX,
            translateY: dy + this.state.initialTranslateY,
        })
    }

    dropCanvas = () => {
        this.setState({
            initialTranslateX: this.state.translateX,
            initialTranslateY: this.state.translateY,
        })
    }

    recordMousePosition = (event) => {
        let eventBounds = this.canvasWrapper.current.getBoundingClientRect();
        this.setState({
            mouseX: (event.pageX - Math.floor(eventBounds.left)) / this.state.scale,
            mouseY: (event.pageY - Math.floor(eventBounds.top)) / this.state.scale,
        })
    }

    render () {
        return (     
            <div className='root flex outer-flex'>
                <div className='text-wrapper' ref={this.leftWrapper}>
                    <div className='inner-text-wrapper flex inner-flex max'>
                        <Editor handleChange={this.props.updateCode}></Editor>
                        <Log value={this.props.log}/>
                    </div>
                    <Dragger drag={this.adjustLeft} className="scrubber"/> 
                </div>

                <div className='view-wrapper darkgray-b' ref={this.rightWrapper}> 
                    <Navbar>
                        <Button onClick={this.props.runCode}>Run</Button>
                        <Button>Export</Button>
                        <Button onClick={this.resetCanvas}>Fit</Button>

                        <span className="coords">{(this.state.mouseX).toFixed(1) + " " + this.state.mouseY.toFixed(1)}</span>
                    </Navbar>
                    <Dragger drag={this.dragCanvas} drop={this.dropCanvas}>
                        <div  
                            onWheel={this.zoomCanvas} 
                            className="view-flex min-max zoomRelative"
                            style={{transform: this.getTransform()}}
                            >
                            <svg 
                                width={this.props.defaultWidth} 
                                height={this.props.defaultHeight} 
                                className='canvas shadow' 
                                viewBox={this.getViewBox()}
                                ref={this.canvasWrapper}
                                onMouseMove={this.recordMousePosition}
                            >
                                {this.props.frame}
                            </svg>
                        </div>
                    </Dragger>
                    
                </div>
            </div>
        );
    }
}

function mapStateToProps(store, ownProps: Props){
    return {
        defaultWidth: store.root.defaultWidth,
        defaultHeight: store.root.defaultHeight,
        log: store.root.log,
        frame: store.root.frame,
    };
}

function mapDispatchToProps(dispatch){
    return {
        runCode: () => dispatch(createAction(ActionType.REQ_COMPILE, null)),
        updateCode: (code) => dispatch(createAction(ActionType.UPDATE_CODE, code)),
    }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App);
export default AppContainer;