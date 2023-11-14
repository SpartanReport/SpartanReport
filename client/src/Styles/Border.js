import React, { useState, useEffect, useRef } from 'react';
import "./SvgBorder.css"
const SvgBorderWrapper = ({ children , height,width,rarity}) => {
    const [scaleX, setScaleX] = useState(1);
    const [scaleY, setScaleY] = useState(1);
        // Original SVG dimensions
        const originalWidth = 230.55;
        const originalHeight = 260.86;
    
        // Calculate scale factors
        const newScaleX = width / originalWidth;
        const newScaleY = height / originalHeight;
    

    const containerRef = useRef();
    console.log(rarity);
    useEffect(() => {
        setScaleX(newScaleX);
        setScaleY(newScaleY);
      }, [width, height]); // This effect will run when `width` or `height` props change.
    return (
        <div ref={containerRef}  className={`${rarity}`} style={{ display: 'inline-block', position: 'relative', height, width }}>
        <svg
          id="Layer_2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 228.55 258.86`}
          className='svgStyle'
          style={{
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: originalWidth+2,
            height: originalHeight,
          }}
        >
                <defs>
                </defs>
                <g id="Layer_3">
                <g id="Boarder">
                    <polygon className="cls-1" points=".05 0 .05 14.6 3.02 14.6 3.02 3.02 225.53 3.02 225.53 14.6 228.55 14.6 228.55 0 .05 0"/>
                    <polygon className="cls-1" points="0 258.86 0 244.26 3.02 244.26 3.02 255.84 225.49 255.84 225.49 244.26 228.5 244.26 228.5 258.86 0 258.86"/>
                    <rect className="cls-2" y="18.41" width="3.02" height="222.03"/>
                    <rect className="cls-2" x="225.53" y="18.41" width="3.02" height="222.03"/>
                </g>
            </g>

            </svg>
            <div style={{ position:'absolute', top: 0, left: 2, width: '100%', height: '100%'}}>
        {children}
      </div>
        </div>

  );
};

export default SvgBorderWrapper;
