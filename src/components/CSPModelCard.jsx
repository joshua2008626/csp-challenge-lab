import Icon from './Icon.jsx';

/**
 * "This game is a CSP" — shows the three ingredients of the *actual* CSP object that the
 * solver is using for the current level (variables, domains, constraints).
 */
export default function CSPModelCard({ csp, domainLabel, constraintLabel, sampleConstraints = [], variableLabel }) {
  const maxShown = 14;
  return (
    <section className="card csp-model" aria-label="The CSP behind this game">
      <h3 className="card-title">
        <Icon name="layers" /> The CSP behind this level
      </h3>
      <div className="csp-model-grid">
        <div className="csp-part">
          <div className="csp-part-title">
            <span className="csp-dot v" /> Variables <b>{csp.variables.length}</b>
          </div>
          <div className="csp-chips">
            {csp.variables.slice(0, maxShown).map((v) => (
              <span key={v} className="chip">
                {variableLabel ? variableLabel(v) : v}
              </span>
            ))}
            {csp.variables.length > maxShown && <span className="chip muted">+{csp.variables.length - maxShown}</span>}
          </div>
        </div>
        <div className="csp-part">
          <div className="csp-part-title">
            <span className="csp-dot d" /> Domain
          </div>
          <div className="csp-text">{domainLabel}</div>
        </div>
        <div className="csp-part">
          <div className="csp-part-title">
            <span className="csp-dot c" /> Constraints <b>{csp.constraints.length}</b>
          </div>
          <div className="csp-text">{constraintLabel}</div>
          {sampleConstraints.length > 0 && (
            <ul className="csp-samples">
              {sampleConstraints.slice(0, 3).map((s) => (
                <li key={s} className="mono">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
