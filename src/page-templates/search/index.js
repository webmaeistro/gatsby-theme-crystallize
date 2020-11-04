import React, { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { navigate, graphql } from "gatsby"
import produce from "immer"

import { useT, useLocale } from "lib/i18n"
import { doSearch } from "lib/api"
import { SEARCH_QUERY, urlToSpec, queryStringToObject } from "lib/search"
import Layout from "components/layout"

import { Wrapper, SearchFooter, Header } from "./styles"
import OrderBy from "./order-by"
import Results from "./results"
import Facets from "./facets"

function cleanFilterForTotalAggregations(filter) {
  return produce(filter, (draft) => {
    delete draft.productVariants.priceRange
    delete draft.productVariants.attributes
  })
}

async function loadPage(spec) {
  const { data } = await doSearch({
    query: SEARCH_QUERY,
    variables: {
      ...spec,
      aggregationsFilter: cleanFilterForTotalAggregations(spec.filter),
    },
  })

  const {
    search,
    aggregations: { aggregations },
  } = data ?? {}

  return {
    search,
    aggregations,
  }
}

function Search(props) {
  const {
    data: { crystallize, crystallize_search } = {},
    location,
    path,
  } = props

  const t = useT()
  const [firstLoad, setFirstLoad] = useState(false)
  const locale = useLocale()
  const [data, setData] = useState({
    search: crystallize_search?.search,
    aggregations: crystallize_search?.aggregations?.aggregations,
  })
  const query = location.search

  /**
   * Memoize the load page function so that it only changes
   * if the asPath or locale changes
   */
  const loadPageCb = useCallback(
    async (query) => {
      const queryObject = queryStringToObject(query)

      const newData = await loadPage(
        urlToSpec({ query: queryObject, asPath: path }, locale)
      )
      setData(newData)
    },
    [path, locale]
  )

  // Query changed
  useEffect(() => {
    if (!firstLoad) {
      setFirstLoad(true)
      return
    }

    loadPageCb(location.search)
  }, [location.search, loadPageCb, firstLoad])

  const spec = urlToSpec({ query, asPath: path }, locale)

  // Change the url query params
  function changeQuery(fn) {
    const queryObject = queryStringToObject(location.search)

    const newQuery = produce(queryObject, (draft) => {
      delete draft.before
      delete draft.after
      fn(draft)
    })
    const pathname = location.pathname.replace(/\/$/, "")
    const newSearchString = new URLSearchParams(newQuery).toString()

    navigate(`${pathname}${newSearchString ? `?${newSearchString}` : ""}`, {
      replace: true,
    })
  }

  function changePage(direction) {
    if (direction === "nextPage") {
      changeQuery((query) => {
        query.after = data.search.pageInfo.endCursor
      })
    } else {
      changeQuery((query) => {
        query.before = data.search.pageInfo.startCursor
      })
    }
  }

  function handleOrderByChange(orderBy, index) {
    changeQuery((query) => {
      if (index > 0) {
        query.orderby = orderBy.value
      } else {
        delete query.orderby
      }
    })
  }

  if (!data.search) {
    return (
      <Layout
        title={crystallize?.folder?.name || "Search"}
        headerItems={crystallize?.headerItems.children}
        loading
      />
    )
  }

  console.log(crystallize)

  return (
    <Layout
      title={crystallize?.folder?.name || "Search"}
      headerItems={crystallize?.headerItems.children}
    >
      <Wrapper>
        <Header>
          <SearchFooter>
            {data && (
              <h3>
                {t("search.foundResults", {
                  count:
                    spec.filter.searchTerm !== "searching" &&
                    data.search.aggregations.totalResults,
                })}
              </h3>
            )}
            <OrderBy orderBy={spec.orderBy} onChange={handleOrderByChange} />
          </SearchFooter>
        </Header>
        <Facets
          aggregations={data?.aggregations ?? {}}
          changeQuery={changeQuery}
          totalResults={data?.search?.aggregations?.totalResults}
          spec={spec}
        />
        <Results
          edges={data?.search?.edges ?? []}
          navigate={changePage}
          pageInfo={data?.search?.pageInfo ?? {}}
        />
      </Wrapper>
    </Layout>
  )
}

Search.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
    pathname: PropTypes.string,
  }).isRequired,
}

export default Search

export const query = graphql`
  query getSearchPage(
    $cataloguePath: String!
    $crystallizeCatalogueLanguage: String!
    $first: Int
    $after: String
    $orderBy: CRYSTALLIZE_SEARCH_OrderBy
    $filter: CRYSTALLIZE_SEARCH_CatalogueSearchFilter
    $aggregationsFilter: CRYSTALLIZE_SEARCH_CatalogueSearchFilter
  ) {
    crystallize {
      headerItems: catalogue(
        language: $crystallizeCatalogueLanguage
        path: "/"
      ) {
        children {
          name
          path
          language
        }
      }

      folder: catalogue(
        language: $crystallizeCatalogueLanguage
        path: $cataloguePath
      ) {
        ...crystallize_item

        children {
          ...crystallize_item
          ...crystallize_product
        }
      }
    }

    crystallize_search {
      aggregations: search(filter: $aggregationsFilter) {
        aggregations {
          price {
            min
            max
          }
          variantAttributes {
            attribute
            value
            count
          }
        }
      }

      search(
        language: $crystallizeCatalogueLanguage
        first: $first
        after: $after
        orderBy: $orderBy
        filter: $filter
      ) {
        aggregations {
          totalResults
          price {
            min
            max
          }
          variantAttributes {
            attribute
            value
            count
          }
        }
        pageInfo {
          totalNodes
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          cursor
          node {
            id
            name
            path
            type
            ... on CRYSTALLIZE_SEARCH_Product {
              matchingVariant {
                price
                attributes {
                  attribute
                  value
                }
                images {
                  url
                  variants {
                    width
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
