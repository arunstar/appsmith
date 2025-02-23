import type { SyntheticEvent } from "react";
import React from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Hits,
  SearchBox,
  Highlight,
  Configure,
  PoweredBy,
} from "react-instantsearch-dom";
import "instantsearch.css/themes/algolia.css";
import { connect, useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { HelpIcons } from "icons/HelpIcons";
import { HelpBaseURL } from "constants/HelpConstants";
import { getDefaultRefinement } from "selectors/helpSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import type { AppState } from "@appsmith/reducers";
import {
  setHelpDefaultRefinement,
  setHelpModalVisibility,
} from "actions/helpActions";
import { Icon } from "@blueprintjs/core";
import moment from "moment";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import { Colors } from "constants/Colors";
import {
  createMessage,
  APPSMITH_DISPLAY_VERSION,
  INTERCOM_CONSENT_MESSAGE,
} from "@appsmith/constants/messages";
import {
  IconSize,
  Icon as ADSIcon,
  Button,
  Category,
  Size,
} from "design-system-old";
import { updateIntercomProperties } from "utils/bootIntercom";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { updateIntercomConsent, updateUserDetails } from "actions/userActions";

const { algolia, appVersion, cloudHosting, intercomAppID } =
  getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

const OenLinkIcon = HelpIcons.OPEN_LINK;
const DocumentIcon = HelpIcons.DOCUMENT;
const GithubIcon = HelpIcons.GITHUB;
const ChatIcon = HelpIcons.CHAT;
const DiscordIcon = HelpIcons.DISCORD;

const StyledOpenLinkIcon = styled(OenLinkIcon)<{ color?: string }>`
  width: 14px;
  height: 14px;
  display: none;
`;

function Hit(props: { hit: { path: string } }) {
  return (
    <div
      className="t--docHit"
      onClick={() => {
        window.open(props.hit.path.replace("master", HelpBaseURL), "_blank");
      }}
    >
      <div className="hit-name t--docHitTitle">
        <DocumentIcon color="#4b4848" height={14} width={11.2} />
        <Highlight attribute="title" hit={props.hit} />
        <StyledOpenLinkIcon
          className="t--docOpenLink open-link"
          color={"#4b4848"}
        />
      </div>
    </div>
  );
}

function DefaultHelpMenuItem(props: {
  item: { label: string; link?: string; id?: string; icon: React.ReactNode };
  onSelect: () => void;
  showIntercomConsent: (val: boolean) => void;
}) {
  const user = useSelector(getCurrentUser);
  return (
    <li className="ais-Hits-item">
      <div
        className="t--docHit"
        id={props.item.id}
        onClick={() => {
          if (props.item.link) window.open(props.item.link, "_blank");
          if (props.item.id === "intercom-trigger") {
            if (intercomAppID && window.Intercom) {
              if (user?.isIntercomConsentGiven) {
                window.Intercom("show");
              } else {
                props.showIntercomConsent(true);
              }
            }
            props.onSelect();
          }
        }}
      >
        <div className="hit-name t--docHitTitle">
          {props.item.icon}
          <span className="ais-Highlight">{props.item.label}</span>
          <StyledOpenLinkIcon
            className="t--docOpenLink open-link"
            color={"#4b4848"}
            height={14}
            width={14}
          />
        </div>
      </div>
    </li>
  );
}

const SearchContainer = styled.div`
  height: 100%;
  background: ${(props) => props.theme.colors.helpModal.background};
  .ais-SearchBox {
    position: relative;
    height: 30px;
    margin: 14px;
    margin-top: 10px;
  }

  .ais-SearchBox-form {
    height: 100%;
    background-color: #fff;
    border-radius: 2px;
  }

  [class^="ais-"] {
    font-size: inherit;
  }

  .ais-Hits {
    overflow: auto;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  .ais-SearchBox-input {
    height: 100%;
    width: 188px;
    padding: 4px 27px;
    padding-right: 14px;
    border-radius: 2px;
    border: 0;
    font-size: 14px;
  }

  .ais-SearchBox-submitIcon {
    width: 10.5px;
    height: 10.5px;
  }

  .ais-Pagination {
    margin-top: 1em;
  }

  .ais-Hits-list {
    margin: 0;
  }
  .ais-Hits-item {
    margin-bottom: 1em;
    width: 100%;
    margin: 0;
    padding: 8px 16px;
    border: 0;
    cursor: pointer;
    box-shadow: none;
  }

  .ais-Hits-item:hover {
    background-color: ${(props) => props.theme.colors.helpModal.itemHighlight};
  }
  .ais-Hits-item:hover .open-link {
    display: block;
  }

  .hit-name {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: -0.195px;
    height: 16px;
    color: #4b4848;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }

  .ais-SearchBox-reset {
    right: 51px;
  }
  .ais-SearchBox-resetIcon {
    width: 10px;
    height: 10px;
  }

  .hit-description {
    color: #888;
    font-size: 14px;
    margin-bottom: 0.5em;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 20px;
    /*Making description two lines*/
    height: 42px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    -webkit-box-orient: vertical;
    /*Making description two lines*/
    /* or 167% */

    letter-spacing: 0.2px;
  }

  .ais-Highlight {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: calc(100% - 36px);
  }

  .ais-Highlight-highlighted {
    background-color: #238770;
  }
  .ais-SearchBox-submit {
    left: 4px;
  }
`;

const Header = styled.div`
  padding: 10px 0;
  position: absolute;
  width: 100%;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  height: 50px;
`;

const StyledPoweredBy = styled(PoweredBy)`
  position: absolute;
  right: 21px;
  top: 30px;
  z-index: 1;

  .ais-PoweredBy-text {
    display: none;
  }
`;

const HelpContainer = styled.div`
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid ${Colors.ALTO};
  padding: 5px 10px;
  height: 30px;
  color: ${Colors.DOVE_GRAY2};
  font-size: 6pt;
`;

const HelpBody = styled.div<{ hideSearch?: boolean }>`
  ${(props) =>
    props.hideSearch
      ? `
    padding: 0;
  `
      : `
    padding-top: 68px;
  `}
  flex: 5;
`;
const ConsentContainer = styled.div`
  padding: 10px 18px;
`;
const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;
const ConsentText = styled.div`
  margin-bottom: 16px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--appsmith-color-black-700);
`;
const ConsentButton = styled(Button)`
  font-size: 11px;
  font-weight: 600;
  width: 94px;
`;

type Props = {
  hitsPerPage: number;
  defaultRefinement: string;
  dispatch: any;
  hideSearch?: boolean;
  hideMinimizeBtn?: boolean;
  user?: User;
};
type State = { showResults: boolean; showIntercomConsent: boolean };

type HelpItem = {
  label: string;
  link?: string;
  id?: string;
  icon: React.ReactNode;
};

const HELP_MENU_ITEMS: HelpItem[] = [
  {
    icon: <DocumentIcon color="#4b4848" height={16} width={16} />,
    label: "Documentation",
    link: "https://docs.appsmith.com/",
  },
  {
    icon: <GithubIcon color="#4b4848" height={16} width={16} />,
    label: "Report a bug",
    link: "https://github.com/appsmithorg/appsmith/issues/new/choose",
  },
  {
    icon: <DiscordIcon color="#4b4848" height={16} width={16} />,
    label: "Join our Discord",
    link: "https://discord.gg/rBTTVJp",
  },
];

if (intercomAppID && window.Intercom) {
  HELP_MENU_ITEMS.push({
    icon: <ChatIcon color="#4b4848" height={16} width={16} />,
    label: "Chat with us",
    id: "intercom-trigger",
  });
}

function IntercomConsent({
  showIntercomConsent,
}: {
  showIntercomConsent: (val: boolean) => void;
}) {
  const user = useSelector(getCurrentUser);
  const instanceId = useSelector(getInstanceId);
  const dispatch = useDispatch();

  const sendUserDataToIntercom = () => {
    updateIntercomProperties(instanceId, user);
    dispatch(
      updateUserDetails({
        intercomConsentGiven: true,
      }),
    );
    dispatch(updateIntercomConsent());
    window.Intercom("show");
    showIntercomConsent(false);
  };
  return (
    <ConsentContainer>
      <ActionsRow>
        <ADSIcon
          fillColor={Colors.GRAY}
          name="arrow-left"
          onClick={() => showIntercomConsent(false)}
          size={IconSize.MEDIUM}
        />
      </ActionsRow>
      <ConsentText>{createMessage(INTERCOM_CONSENT_MESSAGE)}</ConsentText>
      <ConsentButton
        category={Category.primary}
        fill
        onClick={sendUserDataToIntercom}
        size={Size.medium}
        text="CONTINUE"
      />
    </ConsentContainer>
  );
}

class DocumentationSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showResults: props.defaultRefinement.length > 0,
      showIntercomConsent: false,
    };
  }

  onSearchValueChange = (event: SyntheticEvent<HTMLInputElement, Event>) => {
    // @ts-expect-error: value is missing
    const value = event.target.value;
    if (value === "" && this.state.showResults) {
      this.setState({
        showResults: false,
      });
    } else if (value !== "" && !this.state.showResults) {
      this.setState({
        showResults: true,
      });
    }
  };
  handleClose = () => {
    this.props.dispatch(setHelpModalVisibility(false));
    this.props.dispatch(setHelpDefaultRefinement(""));
  };
  render() {
    if (!algolia.enabled) return null;
    return (
      <SearchContainer className="ais-InstantSearch t--docSearchModal">
        {!this.props.hideMinimizeBtn && (
          <Icon
            className="t--docsMinimize"
            color="white"
            icon="minus"
            iconSize={14}
            onClick={this.handleClose}
            style={{
              position: "absolute",
              top: 6,
              right: 10,
              cursor: "pointer",
              zIndex: 1,
            }}
          />
        )}
        <InstantSearch
          indexName={algolia.indexName}
          searchClient={searchClient}
        >
          <Configure hitsPerPage={this.props.hitsPerPage} />
          <HelpContainer>
            {!this.props.hideSearch && (
              <Header>
                <StyledPoweredBy />
                <SearchBox
                  defaultRefinement={this.props.defaultRefinement}
                  onChange={this.onSearchValueChange}
                />
              </Header>
            )}
            <HelpBody hideSearch={this.props.hideSearch}>
              {this.state.showResults ? (
                <Hits hitComponent={Hit as any} />
              ) : !this.state.showIntercomConsent ? (
                <ul className="ais-Hits-list">
                  {HELP_MENU_ITEMS.map((item) => (
                    <DefaultHelpMenuItem
                      item={item}
                      key={item.label}
                      onSelect={this.handleClose}
                      showIntercomConsent={(val: boolean) =>
                        this.setState({ showIntercomConsent: val })
                      }
                    />
                  ))}
                </ul>
              ) : (
                <IntercomConsent
                  showIntercomConsent={(val: boolean) =>
                    this.setState({ showIntercomConsent: val })
                  }
                />
              )}
            </HelpBody>
            {appVersion.id && (
              <HelpFooter>
                <span>
                  {createMessage(
                    APPSMITH_DISPLAY_VERSION,
                    appVersion.edition,
                    appVersion.id,
                    cloudHosting,
                  )}
                </span>
                <span>Released {moment(appVersion.releaseDate).fromNow()}</span>
              </HelpFooter>
            )}
          </HelpContainer>
        </InstantSearch>
      </SearchContainer>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  defaultRefinement: getDefaultRefinement(state),
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(DocumentationSearch);
