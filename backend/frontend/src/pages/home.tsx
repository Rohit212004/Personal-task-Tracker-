
const Home = () => {
  return (
    <section className="home-header" style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#2563eb', fontWeight: 800, fontSize: '2.5rem', marginBottom: '1.5rem' }}>Hello there! 👋</h2>
      <p style={{ fontSize: '1.35rem', color: '#374151', marginBottom: '2.5rem' }}>
        Welcome to <span style={{ color: '#2563eb', fontWeight: 700 }}>Personal Task Tracker</span>.<br />
        Organize your day, boost your productivity, and never miss a task again!
      </p>
      <img
        src="/home-illustration.jpg"
        alt="Task Tracker Illustration"
        style={{
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto 2.5rem auto',
          display: 'block',
          borderRadius: '1.2rem',
          boxShadow: '0 2px 12px 0 rgba(31,38,135,0.10)'
        }}
      />
    </section>
  );
};

export default Home;