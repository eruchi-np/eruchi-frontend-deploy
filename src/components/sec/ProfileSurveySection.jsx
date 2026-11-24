import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { secAPI } from '../../services/api';

function openSecPath(item) {
  if (item?.state === 'refresh') return '/sec-profile/refresh';
  return '/sec-profile';
}

/** Pinned "Add to your profile" / refresh section for the surveys list. */
export default function ProfileSurveySection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancel = false;
    secAPI.getProfileSurveys({ skipErrorToast: true })
      .then((res) => {
        if (!cancel) setData(res.data);
      })
      .catch(() => {
        if (!cancel) setData(null);
      });
    return () => { cancel = true; };
  }, []);

  if (!data?.section || !data.items?.length) return null;

  return (
    <div className="mb-12">
      <div className="shop-head mb-6">
        <div>
          <div className="shop-title-row">
            <span className="shop-dots" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} style={{ '--i': i }} />
              ))}
            </span>
            <h2>{data.section.heading}</h2>
          </div>
          <p className="shop-head-copy">{data.section.subheading}</p>
        </div>
      </div>
      <div className="surveys-list">
        {data.items.map((item) => (
          <article
            key={item.code}
            className="surveys-row"
            onClick={() => item.code === 'PC2' && navigate(openSecPath(item))}
          >
            <span className="surveys-row-icon" aria-hidden="true" />
            <div className="surveys-row-copy">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div className="surveys-row-meta">
              <span className="surveys-row-time">{item.minutes}Min</span>
              <span className="surveys-row-credits">{item.credits} Ruchi Credits</span>
            </div>
            <button
              type="button"
              className="surveys-row-view"
              onClick={(event) => {
                event.stopPropagation();
                if (item.code === 'PC2') navigate(openSecPath(item));
              }}
            >
              view
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Single prompt for the profile page (same copy as the surveys section). */
export function ProfileSurveyPrompt() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancel = false;
    secAPI.getProfileSurveys({ skipErrorToast: true })
      .then((res) => {
        if (!cancel) setData(res.data);
      })
      .catch(() => {
        if (!cancel) setData(null);
      });
    return () => { cancel = true; };
  }, []);

  if (!data?.section || !data.prompt_target) return null;

  const item = data.items?.find((i) => i.code === data.prompt_target);

  return (
    <button
      type="button"
      className="profile-outdated-alert"
      onClick={() => {
        if (data.prompt_target === 'PC2') navigate(openSecPath(item));
      }}
    >
      <span>
        <strong>{data.section.heading}</strong>
        {' '}
        {data.section.subheading}
      </span>
    </button>
  );
}
