import body from './assets/mascot-body.webp';
import head from './assets/mascot-head.webp';

// Both layers are the same orthographic portrait of the pasture's flower-crowned sheep.
export function Mascot() {
  return (
    <div className="pack-mascot" aria-hidden="true">
      <img className="mascot-body" src={body} alt="" draggable={false} />
      <div className="mascot-head">
        <img src={head} alt="" draggable={false} />
        <div className="mascot-eyes">
          {['left', 'right'].map((side) => (
            <span key={side} className={`mascot-eye ${side}`}>
              <i className="eye-white">
                <i className="eye-pupil" />
              </i>
              <i className="eye-crease" />
            </span>
          ))}
        </div>
        <i className="mascot-mouth" />
        <i className="mascot-drop" />
      </div>
    </div>
  );
}
