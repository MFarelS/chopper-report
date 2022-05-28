import { Form } from 'react-bootstrap';
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import DateTimePicker from 'react-datetime-picker'

import * as moment from 'moment';

function Debug({ api, options, setOption }) {

  const [timeOffset, setTimeOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(moment());
  const [timer, setTimer] = useState(null);

  const [search] = useSearchParams();
  const debug = search.get('d') === '1';

  useEffect(() => {
    if (timer) {
      clearInterval(timer);
    }
    if (!debug) {
      return;
    }

    const t = setInterval(() => {
      setCurrentDate(moment());
    }, 500);
    setTimer(t);
  }, []);

  useEffect(() => {
    if (timeOffset !== 0) {
      setOption('time', moment().unix() + timeOffset);
    } else {
      setOption('time', null);
    }
  }, [timeOffset]);

  if (!debug) {
    return (<></>);
  }

  const offset = moment(currentDate).add(timeOffset, 'seconds');

  return (
    <div className="debug-panel mx-auto pe-auto" style={{ maxWidth: '660px' }}>
      <DateTimePicker
        className="text-light"
        minDate={moment().subtract(30, 'days').toDate()}
        maxDate={new Date()}
        maxDetail="second"
        value={offset.toDate()}
        onChange={(date) => setTimeOffset(Math.floor(date.getTime() / 1000) - moment().unix())} />
      <Form.Range
        min={86400 * 30 * -1}
        max={0}
        value={timeOffset}
        onChange={(event) => setTimeOffset(Number(event.target.value))} />
      {/*<Form.Switch label="Show state info" control={<div
        checked={options.showStateInfo}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showStateInfo', event.target.checked)} />} />
      <Form.Switch label="Show radius" control={<div
        checked={options.showRadius}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showRadius', event.target.checked)} />} />
      <Form.Switch label="Show history" control={<div
        checked={options.showHistory}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showHistory', event.target.checked)} />} />*/}
    </div>
  );
}

export default Debug;
