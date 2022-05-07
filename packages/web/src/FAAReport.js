import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from "react-router-dom";

import Stack from 'react-bootstrap/Stack'
import Table from 'react-bootstrap/Table'
import Overlay from 'react-bootstrap/Overlay'
import Tooltip from 'react-bootstrap/Tooltip'

import { IoCopyOutline as CopyIcon } from "react-icons/io5";

import * as moment from 'moment';

function FAAReport({ api, icao24, aircraft }) {

  const [address, setAddress] = useState(null);
  const [copyAlert, setCopyAlert] = useState({});
  const copyButtons = useRef({});
  const [search] = useSearchParams();
  const time = search.get('time');

  const now = time || Math.floor(Date.now() / 1000);
  const description = [
    { field: 'Manufactuer', value: aircraft.metadata.manufacturer },
    { field: 'Model', value: aircraft.metadata.model },
    { field: 'Owner', value: aircraft.metadata.owner },
    { field: 'Callsign', value: aircraft.state.callsign },
    { field: 'Registration', value: aircraft.metadata.registration },
    { field: 'Squawk', value: aircraft.state.squawk },
  ].filter(x => x.value !== null).map(x => `${x.field}: ${x.value}`).join('\n');

  const fields = [
    { field: 'Event Address', value: [address?.house_number, address?.road].filter(x => x !== null).join(' ') },
    { field: 'City', value: address?.city },
    { field: 'Zip Code', value: address?.postcode },
    { field: 'Start Time', value: aircraft.state.hovering_time ? moment.unix(now - aircraft.state.hovering_time).format('MM/DD/YYYY HH:mm') : "N/A" },
    { field: 'End Time', value: moment.unix(time || now).format('MM/DD/YYYY HH:mm') },
    { field: 'Description', value: `Aircraft has been hovering over this location for over ${moment.duration(aircraft.state.hovering_time * 1000).humanize()} causing a significant disturbance.` },
    { field: 'Aircraft Type', value: aircraft.isHelicopter() ? 'Helicopter' : 'Unknown' },
    { field: 'Aircraft Description', value: description },
  ];

  const copyTextToClipboard = (field, text) => {
    if (!navigator.clipboard) {
      setCopyAlert(values => ({ ...values, [field]: "Couldn't copy text to clipboard." }));
      setTimeout(() => setCopyAlert(values => ({ ...values, [field]: null})), 3000);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopyAlert(values => ({ ...values, [field]: "Copied!" }));
      setTimeout(() => setCopyAlert(values => ({ ...values, [field]: null})), 2000);
    }, (err) => {
      setCopyAlert(values => ({ ...values, [field]: err.message }));
      setTimeout(() => setCopyAlert(values => ({ ...values, [field]: null})), 3000);
      console.log(err);
    });
  }

  useEffect(() => {
    try {
      (async () => {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${aircraft.state.latitude}&lon=${aircraft.state.longitude}&format=json`);
        const { address } = await response.json();
        setAddress(address);
      })();
    } catch (error) {
      console.log(error);
    }
  }, [aircraft]);

  return (
    <Stack className="text-light">
      <p>Use the following values to help fill out the form below.</p>
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>Copy</th>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((x) => (
            <tr key={x.field.replace(" ", "")}>
              <td className="text-center" onClick={() => copyTextToClipboard(x.field, x.value)}>
                <span ref={el => copyButtons.current[x.field] = el}>
                  <CopyIcon className="fs-5"  />
                </span>
                <Overlay target={copyButtons.current[x.field]} show={copyAlert[x.field] !== undefined && copyAlert[x.field] !== null} placement="right">
                  {(props) => (
                    <Tooltip id="overlay-example" {...props}>
                      {copyAlert[x.field]}
                    </Tooltip>
                  )}
                </Overlay>
              </td>
              <td>{x.field}</td>
              <td>{x.value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <iframe id="faa" title="FAA Noise Complaints" className="w-100" style={{ height: '80vh' }} src="https://noise.faa.gov/noise/pages/noise.html" />
    </Stack>
  );
}

export default FAAReport;
