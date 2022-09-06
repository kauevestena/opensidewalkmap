from turtle import fillcolor
import folium
import pandas as pd
import geopandas as gpd
from functions import *

m = folium.Map(
    # min_zoom=2,
    # # crs="EPSG4326"
    # max_zoom=10,
    tiles=None
)

folium.TileLayer(tiles='Stamen Toner',opacity=0.4,min_zoom=2,max_zoom=10).add_to(m)


# CSV Columns are:
#   city_name,center_long,center_lat,url

cities_df = pd.read_csv('cities_data.csv')


cities_gdf = gpd.GeoDataFrame(cities_df,geometry=gpd.points_from_xy(cities_df.center_long,cities_df.center_lat),crs='EPSG:4326')

weblinks = []

for entry in cities_df.itertuples():
    weblinks.append(a_href_str(entry.city_name,entry.url))

cities_gdf['Place:'] = weblinks

#800080 

folium.GeoJson(
    data=cities_gdf,
    marker=folium.CircleMarker(
        radius=7,
        fill=True,
        color='#800080',
        fill_color='magenta',
        fill_opacity=1,
        ),
    popup=folium.GeoJsonPopup(
    fields=['Place:'],
    # style='color:red'
    ),
    highlight_function=simple_highlight,
).add_to(m)




m.save('index.html')