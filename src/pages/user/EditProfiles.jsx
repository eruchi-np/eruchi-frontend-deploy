import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { secAPI } from '../../services/api';
import ProfileShell from '../../components/layout/ProfileShell';
import HomeFooter from '../../components/homepage/HomeFooter';

const EditProfiles = () => {
  const navigate = useNavigate();
  const [editList, setEditList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    secAPI.getProfileSurveys({ skipErrorToast: true })
      .then((res) => {
        if (!cancel) setEditList(res.data?.edit_list || []);
      })
      .catch(() => {
        if (!cancel) setEditList([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => { cancel = true; };
  }, []);

  const openSec = (item) => {
    if (item.added) navigate('/sec-profile/edit');
    else navigate('/sec-profile');
  };

  return (
    <ProfileShell footer={<HomeFooter />}>
      <main className="profile-main">
        <section className="profile-hero">
          <h1>Edit profiles</h1>
          <p className="profile-hero-copy">Choose which profile you want to update.</p>
        </section>

        <div className="profile-surveys" style={{ marginTop: 24 }}>
          <div className="profile-survey">
            <div className="profile-survey-copy">
              <h3>Basic profile</h3>
              <p>Your demographics and household durables.</p>
            </div>
            <button
              type="button"
              className="profile-btn profile-btn-outline profile-survey-view"
              onClick={() => navigate('/edit-profile')}
            >
              Edit
            </button>
          </div>

          {loading ? <p>Loading…</p> : null}

          {editList.map((item) => (
            <div className="profile-survey" key={item.code}>
              <div className="profile-survey-copy">
                <h3>{item.name}</h3>
                <p>{item.added ? 'Saved on your profile.' : 'Not added yet.'}</p>
              </div>
              <button
                type="button"
                className="profile-btn profile-btn-outline profile-survey-view"
                onClick={() => openSec(item)}
              >
                {item.added ? 'Edit' : 'Add'}
              </button>
            </div>
          ))}

          <div className="profile-survey">
            <div className="profile-survey-copy">
              <h3>Lifestyle</h3>
              <p>Your day-to-day living situation.</p>
            </div>
            <button
              type="button"
              className="profile-btn profile-btn-outline profile-survey-view"
              onClick={() => navigate('/additional-profile')}
            >
              Edit
            </button>
          </div>
        </div>
      </main>
    </ProfileShell>
  );
};

export default EditProfiles;
