const gql_fetch_index=`query ProfileChannelsIndexQuery($id: ID!, $type: IndexedChannelsTypes) {
    identity(id: $id) {
      ...ProfileLayoutFragment,
      id
      identifiable {
        ...ProfileChannelsIndexFragment
      }
    }
  }
  
  # query ProfilePageQuery($id: ID!) {
  #   identity(id: $id) {
  #     ...ProfileLayoutFragment
  #     id
  #     identifiable {
  #       __typename
  #       ... on Model {
  #         id
  #         __typename
  #       }
  #     }
  #   }
  # }
  
  fragment ProfileChannelsIndexFragment on Identifiable {
    ... on Model {
      id
      __typename
    }
    ... on User {
      channels_index(type: $type) {
        key
        channels {
          ...ChannelCompactFragment
          id
        }
        __typename
      }
      __typename
    }
    ... on Group {
      channels_index(type: $type) {
        key
        channels {
          ...ChannelCompactFragment
          id
          __typename
        }
        __typename
      }
      __typename
    }
  }
  
  fragment ChannelCompactFragment on Channel {
    id
    slug
    href
    title
    visibility_name
    counts {
      contents
    }
    owner {
      __typename
      ... on User {
        id
        name
        __typename
      }
      ... on Group {
        id
        name
        __typename
      }
    }
  }
  
  
  fragment ProfileLayoutFragment on Identity {
    ...ProfileHeaderFragment
    ...ProfileMetadataFragment
  }
  fragment ProfileHeaderFragment on Identity {
    id
    name
    identifiable {
      __typename
      ... on Group {
        ...ProfileGroupAvatarGroupFragment
        ...ProfileContextMenuGroupFragment
        id
        href
        slug
        is_upgradeable
        __typename
      }
      ... on User {
        ...ProfileContextMenuUserFragment
        id
        href
        slug
        __typename
      }
    }
  }
  fragment ProfileGroupAvatarGroupFragment on Group {
    ...AvatarGroupFragment
    id
    avatar_state
    iso_updated_at: updated_at(format: 
  "%Y-%m-%dT%H:%M:%S.%LZ")
  }
  fragment AvatarGroupFragment on Group {
    __typename
    id
    href
    avatar(size: LARGE)
    initials
    name
  }
  fragment ProfileContextMenuGroupFragment on Group {
    id
  }
  
  fragment ProfileContextMenuUserFragment on User {
    id
    name
    is_me
    is_muted
  }
  fragment ProfileMetadataFragment on Identity {
    id
    identifiable {
      ...ProfileMetadataUserFragment
      ...ProfileMetadataGroupFragment
      __typename
    }
  }
  fragment ProfileMetadataUserFragment on User {
    id
    href
    created_at(format: 
  "%B %Y")
    bio(format:MARKDOWN)
    bio_html: bio(format: HTML)
  }
  
  fragment ProfileMetadataGroupFragment on Group {
    ...ProfileMetadataIndexOwnerGroupFragment
    id
    href
    bio: description(format: MARKDOWN)
    bio_html: description(format: HTML)
    created_at(format: "%B %Y")
    user {
      ...AvatarUserFragment
      id
      href
      name
      __typename
    }
    users {
      ...AvatarUserFragment
      id
      __typename
    }
  }
  fragment ProfileMetadataIndexOwnerGroupFragment on Group {
    id
    name
    href
  }
  fragment AvatarUserFragment on User {
    __typename
    id
    href
    avatar(size: LARGE)
    initials
    name
  }`;