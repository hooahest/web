import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { formatSeconds, calculateDistance, calculateRelativeXY, bindWidth } from 'utility';
import ReactTooltip from 'react-tooltip';
import stylePropType from 'react-style-proptype';
import { IconRadiant, IconDire, IconDot } from 'components/Icons';
import TeamTable from 'components/Match/TeamTable';
import { teamfightColumns } from 'components/Match/matchColumns';
import PlayerThumb from 'components/Match/PlayerThumb';
import strings from 'lang';
import Timeline from 'components/Match/Overview/Timeline';
import DotaMap from 'components/DotaMap';
import styled from 'styled-components';
import constants from '../../constants';

const Styled = styled.div`
.parentContainer {
  display: flex;
  flex-direction: column;
  margin: 0 -5px;
}

.timelineContainer {
  margin-bottom: 75px;
}

.mapAndInfoContainer {
  margin: 0 5px 10px 5px;
}

.headerGold {
  margin: 0 25px;
}

.header {
  margin: 10px 0 66px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.headerSubInfo {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 10px;

  & svg {
    margin: 0;
  }
}

.teamfightContainer {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.tableContainer {
  flex-grow: 1;
  overflow-x: hidden;
  margin: -56px 5px 0 5px;
}

.map {
  position: relative;
  max-width: 400px;
  max-height: 400px;
  background-size: contain;
}

.mapIcon {
  position: absolute;
  margin: 0 !important;
}

.teamfightIcon {
  position: absolute;
  margin: 0 !important;
  cursor: pointer;
}

.tombstone {
  position: absolute;
  margin: 0 !important;
  fill: ${constants.colorGolden};
  opacity: 0.75;
}

.radiantTombstone {
  fill: ${constants.colorSuccess};
}

.direTombstone {
  fill: ${constants.colorDanger};
}

.radiantTombstoneTooltip {
  border-width: 2px !important;
  border-color: ${constants.colorSuccess} !important;
}

.direTombstoneTooltip {
  border-width: 2px !important;
  border-color: ${constants.colorDanger} !important;
}

.tooltipContainer {
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 10px;
  margin: -8px -12px;

  & > * {
    margin: 0 5px;

    &:first-child {
      margin-left: 0;
    }

    &:last-child {
      margin-right: 0;
    }
  }

  & > div {
    margin: 0;
    color: ${constants.colorMutedLight};
  }
}

.teamfightTooltipContainer {
  flex-direction: column;
}

.winner {
  filter: drop-shadow(0 0 20px #000);
  padding: 0;
}

.goldChange {
  display: flex;
  align-items: center;

  & img {
    margin-left: 5px;
    filter: drop-shadow(0 0 5px ${constants.colorGolden});
  }
}

.radiantSelected {
  & .header {
    color: ${constants.colorSuccess};
  }
}

.direSelected {
  & .header {
    color: ${constants.colorDanger};
  }
}

.radiant {
  filter: drop-shadow(0 0 20px #000);
  padding: 0;

  & .goldChange {
    color: ${constants.colorSuccess};
  }

  margin: 0;
  fill: #f5f5f5;
  & svg {
    filter: drop-shadow(0 0 5px green);
  }
}

.dire {
  filter: drop-shadow(0 0 20px #000);
  padding: 0;

  & .goldChange {
    color: ${constants.colorDanger};
  }

  & svg {
    filter: drop-shadow(0 0 5px red);
  }

  margin: 0;
  fill: #000000;
}

.teamfightIconSvg {
  & svg {
    transition: ${constants.linearTransition};
  }
}

.hovered {
  & svg {
    fill: ${constants.colorBlue} !important;
  }
}

.selected {
  & svg {
    fill: ${constants.colorGolden} !important;
  }
}
`;

const MAP_WIDTH = 400;
const iconSize = (mapWidth, factor = 12, minSize = 15) =>
  (mapWidth / factor <= minSize ? minSize : mapWidth / factor);

const style = (width, position, iconSizeOverride, options = { noTopAdjustment: false }) => ({
  width: iconSizeOverride || iconSize(width),
  height: iconSizeOverride || iconSize(width),
  top: options.noTopAdjustment ? ((width / 127) * position.y) : ((width / 127) * position.y) - (iconSizeOverride || iconSize(width) / 2),
  left: ((width / 127) * position.x) - (iconSizeOverride || iconSize(width) / 2),
});

const isRadiant = radiantGoldDelta => radiantGoldDelta > 0;

const IconType = _isRadiant => (_isRadiant ? IconRadiant : IconDire);

export const TeamfightIcon = ({
  position, tooltipKey, mapWidth = MAP_WIDTH, onClick, Icon, ...props
}) => (
  <Icon
    className="teamfightIcon"
    style={style(mapWidth, position)}
    data-tip
    data-for={tooltipKey}
    onClick={onClick}
    {...props}
  />
);

export const GoldDelta = ({ radiantGoldDelta }) => (
  <div className="goldChange">
    {isRadiant(radiantGoldDelta) ? radiantGoldDelta : radiantGoldDelta * -1}
    <img src={`${process.env.REACT_APP_API_HOST}/apps/dota2/images/tooltips/gold.png`} alt="" />
  </div>
);

const getIconStyle = radiantGoldDelta => (isRadiant(radiantGoldDelta) ? 'radiant' : 'dire');
const getSelectedStyle = radiantGoldDelta =>
  (isRadiant(radiantGoldDelta) ? 'radiantSelected' : 'direSelected');

const getTombStyle = position => position.reduce(
  (str, _position) => {
    const radStr = _position.isRadiant ? 'radiant' : 'dire';
    if (str !== radStr) {
      return 'both';
    }
    return str;
  },
  position[0].isRadiant ? 'radiant' : 'dire',
);

export const Tombstones = ({ deathPositions, mapWidth, tooltipKey }) => (
  <div>
    {deathPositions.map((position, index) => (
      <div key={index}>
        <TeamfightIcon
          Icon={IconDot}
          position={position[0]}
          mapWidth={mapWidth}
          tooltipKey={`${index}_${tooltipKey}`}
          className={`mapIcon ${getTombStyle(position)}Tombstone`}
          style={style(mapWidth, position[0], iconSize(mapWidth, 20))}
        />
        <ReactTooltip
          id={`${index}_${tooltipKey}`}
          effect="solid"
          border
          class={`${getTombStyle(position)}TombstoneTooltip`}
        >
          {position.map((pos, _index) => (
            <div key={_index} className="tooltipContainer">
              <PlayerThumb {...pos.player} />
              <div>{strings.tooltip_tombstone_killer}</div>
              <PlayerThumb {...pos.killer} />
            </div>
          ))}
        </ReactTooltip>
      </div>
    ))}
  </div>
);

export const Teamfight = ({
  position,
  tooltipKey,
  start,
  end,
  radiantGoldDelta,
  selected,
  hovered,
  mapWidth,
  onClick,
  deathPositions,
}) => (
  <div>
    <div className={getIconStyle(radiantGoldDelta)}>
      <div className={`teamfightIconSvg ${hovered && 'hovered'} ${selected && 'selected'}`}>
        <TeamfightIcon
          position={position}
          isRadiant={isRadiant(radiantGoldDelta)}
          tooltipKey={tooltipKey}
          mapWidth={mapWidth}
          onClick={onClick}
          Icon={IconType(isRadiant(radiantGoldDelta))}
        />
      </div>
      <ReactTooltip
        id={tooltipKey}
        effect="solid"
      >
        <div className="tooltipContainer teamfightTooltipContainer">
          <div>{formatSeconds(start)} - {formatSeconds(end)}</div>
          <div>
            <GoldDelta radiantGoldDelta={radiantGoldDelta} />
          </div>
        </div>
      </ReactTooltip>
    </div>
    {selected && <Tombstones deathPositions={deathPositions} mapWidth={mapWidth} tooltipKey={tooltipKey} />}
  </div>
);

const avgPosition = ({ deaths_pos: deathPositions }) => {
  const avgs = deathPositions.reduce((avg, position, index) => {
    const posTotal = position.reduce((_avg, _position) => ({
      x: _avg.x + _position.x,
      y: _avg.y + _position.y,
      length: _avg.length + 1,
    }), {
      x: 0,
      y: 0,
      length: 0,
    });
    const newAvg = {
      x: avg.x + posTotal.x,
      y: avg.y + posTotal.y,
      length: avg.length + posTotal.length,
    };

    if (index === deathPositions.length - 1) {
      newAvg.x /= newAvg.length;
      newAvg.y /= newAvg.length;
    }
    return newAvg;
  }, {
    x: 0,
    y: 0,
    length: 0,
  });
  return {
    x: avgs.x,
    y: avgs.y,
  };
};

class TeamfightMap extends Component {
  constructor(props) {
    super();
    this.isSelected = this.isSelected.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onIconClick = this.onIconClick.bind(this);
    this.onTimelineIconClick = this.onTimelineIconClick.bind(this);
    this.onTimelineHover = this.onTimelineHover.bind(this);
    this.onTeamfightHover = this.onTeamfightHover.bind(this);
    this.curriedTeamfightHandler = this.curriedTeamfightHandler.bind(this);
    const { teamfights = [] } = props;
    const teamfight = teamfights.length > 0 ? teamfights[0] : null;
    this.state = {
      teamfight,
    };
  }

  onTimelineIconClick(start) {
    return this.curriedTeamfightHandler(this.onIconClick, start);
  }

  onTimelineHover(start) {
    return this.curriedTeamfightHandler(this.onTeamfightHover, start);
  }

  onTeamfightHover(teamfight) {
    return () => {
      this.setState({
        hoveredTeamfight: teamfight,
      });
    };
  }

  onIconClick(teamfight) {
    return () => {
      // We do this because we need to prevent the map click event from
      // being executed. That click event is innaccurate if the actual icon is clicked.
      // event.stopPropagation();
      this.setState({
        teamfight,
      });
    };
  }

  onMapClick(width) {
    return (event) => {
      const { x: x1, y: y1 } = calculateRelativeXY(event);
      const { teamfights } = this.props;
      const newSelection = teamfights
        .reduce((cursor, teamfight) => {
          let newCursor = { ...cursor };
          const { left: x2, top: y2 } = style(width, avgPosition(teamfight));
          const distance = calculateDistance(x1, y1, x2 + (iconSize(width) / 2), y2 + (iconSize(width) / 2));
          if (distance < cursor.distance) {
            newCursor = {
              teamfight,
              distance,
            };
          }
          return newCursor;
        }, {
          teamfight: this.state.teamfight,
          distance: Infinity,
        });
      this.setState({
        teamfight: newSelection.teamfight,
      });
    };
  }

  curriedTeamfightHandler(fn, start) {
    return (event) => {
      fn(this.props.teamfights.find(tf => tf.start === start))(event);
    };
  }

  isHovered(teamfight = { start: null }) {
    return this.state.hoveredTeamfight && this.state.hoveredTeamfight.start === teamfight.start;
  }

  isSelected(teamfight = { start: null }) {
    return this.state.teamfight && this.state.teamfight.start === teamfight.start;
  }

  render() {
    const { teamfights = [], match } = this.props;
    const teamfight = this.state.teamfight || {};
    const Icon = IconType(isRadiant(teamfight.radiant_gold_advantage_delta));
    return (
      <Styled>
        <div className="timelineContainer">
          <Timeline
            match={match}
            onTeamfightClick={this.onTimelineIconClick}
            onTeamfightHover={this.onTimelineHover}
            selectedTeamfight={teamfight && teamfight.start}
          />
        </div>
        <div className={`parentContainer ${getSelectedStyle(teamfight.radiant_gold_advantage_delta)}`}>
          <div className="teamfightContainer">
            <div className="mapAndInfoContainer">
              <DotaMap
                width={400}
                maxWidth={400}
                startTime={match.start_time}
              >
                {teamfights.map((teamFight, index) => (
                  <Teamfight
                    selected={this.isSelected(teamFight)}
                    hovered={this.isHovered(teamFight)}
                    key={index}
                    onClick={this.onIconClick(teamFight)}
                    position={avgPosition(teamFight)}
                    tooltipKey={`${index}_${teamFight.start}`}
                    start={teamFight.start}
                    end={teamFight.end}
                    radiantGoldDelta={teamFight.radiant_gold_advantage_delta}
                    deathPositions={teamFight.deaths_pos}
                    mapWidth={bindWidth(400, 400)}
                  />
                ))}
              </DotaMap>
              <header className="header">
                <div className="muted">
                  {formatSeconds(teamfight.start)} - {formatSeconds(teamfight.end)}
                </div>
                <div className="headerSubInfo">
                  <div className={getIconStyle(teamfight.radiant_gold_advantage_delta)}>
                    <Icon style={{ height: iconSize(bindWidth(400, 400)), width: iconSize(bindWidth(400, 400)) }} />
                  </div>
                  <span className="headerGold"><GoldDelta radiantGoldDelta={teamfight.radiant_gold_advantage_delta} /></span>
                </div>
              </header>
            </div>
            <div className="tableContainer">
              <TeamTable
                players={teamfight.players && teamfight.players.filter(p => p.participate)}
                columns={teamfightColumns}
                radiantTeam={this.props.match.radiant_team}
                direTeam={this.props.match.dire_team}
              />
            </div>
          </div>
        </div>
      </Styled>
    );
  }
}

const {
  arrayOf, object, shape, number, bool, func, string, array,
} = PropTypes;
const positionShape = {
  x: number,
  y: number,
};

TeamfightIcon.propTypes = {
  position: shape(positionShape),
  tooltipKey: string,
  mapWidth: number,
  onClick: func, // not required because tombstone doesn't need click fn
  Icon: func,
  style: stylePropType,
};

GoldDelta.propTypes = {
  radiantGoldDelta: number,
};

Tombstones.propTypes = {
  tooltipKey: string,
  mapWidth: number,
  deathPositions: arrayOf(array),
};

Teamfight.propTypes = {
  position: shape(positionShape),
  tooltipKey: string,
  start: number,
  end: number,
  radiantGoldDelta: number,
  selected: bool,
  hovered: bool,
  mapWidth: number,
  onClick: func,
  deathPositions: arrayOf(array),
};

TeamfightMap.propTypes = {
  teamfights: arrayOf(object),
  match: shape({}),
};

export default TeamfightMap;
